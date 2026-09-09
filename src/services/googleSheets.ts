import { Transaction, FinancialSummaryReport } from '../types';

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  webViewLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  owners?: Array<{ displayName?: string; emailAddress?: string }>;
}

export interface SheetMetadata {
  sheetId: number;
  title: string;
  index: number;
}

export interface SpreadsheetDetails {
  spreadsheetId: string;
  title: string;
  sheets: SheetMetadata[];
}

/**
 * Lists the user's existing Google Sheets from Google Drive
 */
export async function listDriveSpreadsheets(accessToken: string): Promise<DriveSpreadsheetFile[]> {
  const query = encodeURIComponent("mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
  const fields = encodeURIComponent('files(id, name, webViewLink, createdTime, modifiedTime, owners)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime desc&pageSize=30`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to list Google Sheets: ${response.statusText} (${errorBody})`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Gets metadata of a specific spreadsheet, including available sheets/tabs
 */
export async function getSpreadsheetDetails(accessToken: string, spreadsheetId: string): Promise<SpreadsheetDetails> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to fetch spreadsheet details: ${response.statusText} (${errorBody})`);
  }

  const data = await response.json();
  const sheets: SheetMetadata[] = (data.sheets || []).map((s: any) => ({
    sheetId: s.properties?.sheetId ?? 0,
    title: s.properties?.title || 'Sheet1',
    index: s.properties?.index ?? 0,
  }));

  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Untitled Spreadsheet',
    sheets,
  };
}

/**
 * Creates a formatted Google Spreadsheet for KinFinance with full transactions and optional summary tabs
 */
export async function createKinFinanceSpreadsheet(
  accessToken: string,
  title: string,
  transactions: Transaction[],
  summary?: FinancialSummaryReport | null
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // 1. Prepare Transactions rows
  const txHeaders = [
    'Date',
    'Title / Description',
    'Type',
    'Category',
    'Amount ($)',
    'Member Name',
    'Status',
    'Receipt Attached',
    'Receipt File',
    'Member Notes',
    'Reviewed By',
    'Review Remarks',
    'Transaction ID',
  ];

  const txRows = transactions.map(tx => [
    tx.date,
    tx.title,
    tx.type.toUpperCase(),
    tx.categoryName,
    tx.amount,
    tx.userName,
    tx.status.toUpperCase(),
    tx.receiptUrl ? 'YES' : 'NO',
    tx.receiptFileName || '',
    tx.notes || '',
    tx.reviewedByName || '',
    tx.reviewNotes || '',
    tx.id,
  ]);

  // Sheets specification
  const sheetsPayload: any[] = [
    {
      properties: {
        title: 'Transactions Ledger',
        gridProperties: {
          frozenRowCount: 1,
        },
      },
      data: [
        {
          startRow: 0,
          startColumn: 0,
          rowData: [
            {
              values: txHeaders.map(h => ({
                userEnteredValue: { stringValue: h },
                userEnteredFormat: {
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                  backgroundColor: { red: 0.05, green: 0.45, blue: 0.35 }, // Emerald green
                  horizontalAlignment: 'LEFT',
                },
              })),
            },
            ...txRows.map(row => ({
              values: row.map(val => {
                if (typeof val === 'number') {
                  return {
                    userEnteredValue: { numberValue: val },
                    userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } },
                  };
                }
                return {
                  userEnteredValue: { stringValue: String(val) },
                };
              }),
            })),
          ],
        },
      ],
    },
  ];

  // Optional tab: Executive Summary & KPI metrics
  if (summary) {
    const summaryRows = [
      ['Metric', 'Amount / Value ($)', 'Description'],
      ['Total Approved Family Expenses', summary.totalApprovedExpenses, 'Verified receipts approved by Family Head'],
      ['Total Approved Family Inflow / Income', summary.totalApprovedIncome, 'Verified family deposits and income'],
      ['Net Family Reserve / Savings', summary.netSavings, summary.netSavings >= 0 ? 'Surplus in family vault' : 'Deficit in current period'],
      ['Total Pending in Approval Queue', summary.pendingAmount, `${summary.pendingCount} transactions awaiting verification`],
      ['Total Rejected Submissions', summary.rejectedCount, 'Transactions declined with reviewer remarks'],
    ];

    sheetsPayload.push({
      properties: {
        title: 'Executive Summary',
        gridProperties: {
          frozenRowCount: 1,
        },
      },
      data: [
        {
          startRow: 0,
          startColumn: 0,
          rowData: [
            {
              values: summaryRows[0].map(h => ({
                userEnteredValue: { stringValue: String(h) },
                userEnteredFormat: {
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                  backgroundColor: { red: 0.1, green: 0.3, blue: 0.6 }, // Slate blue
                },
              })),
            },
            ...summaryRows.slice(1).map(row => ({
              values: row.map(val => {
                if (typeof val === 'number') {
                  return {
                    userEnteredValue: { numberValue: val },
                    userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } },
                  };
                }
                return {
                  userEnteredValue: { stringValue: String(val) },
                };
              }),
            })),
          ],
        },
      ],
    });

    // Optional tab: Category Breakdown
    if (summary.categoryBreakdown && summary.categoryBreakdown.length > 0) {
      const catHeaders = ['Category Name', 'Total Spent ($)', 'Share (%)', 'Transactions Count', 'Monthly Budget ($)', 'Budget Status'];
      const catRows = summary.categoryBreakdown.map(cat => {
        const budget = cat.budget || 0;
        const status = budget > 0 && cat.amount > budget ? 'OVER BUDGET' : budget > 0 ? 'Within Budget' : 'No Limit';
        return [
          cat.categoryName,
          cat.amount,
          `${cat.percentage}%`,
          cat.count,
          budget,
          status,
        ];
      });

      sheetsPayload.push({
        properties: {
          title: 'Category Budgets',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: catHeaders.map(h => ({
                  userEnteredValue: { stringValue: h },
                  userEnteredFormat: {
                    textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                    backgroundColor: { red: 0.5, green: 0.2, blue: 0.4 }, // Berry / Plum
                  },
                })),
              },
              ...catRows.map(row => ({
                values: row.map(val => {
                  if (typeof val === 'number') {
                    return {
                      userEnteredValue: { numberValue: val },
                    };
                  }
                  return {
                    userEnteredValue: { stringValue: String(val) },
                  };
                }),
              })),
            ],
          },
        ],
      });
    }

    // Optional tab: Member Contributions
    if (summary.memberContributions && summary.memberContributions.length > 0) {
      const memHeaders = ['Member Name', 'Relationship', 'Total Spent ($)', 'Share (%)', 'Transactions Count'];
      const memRows = summary.memberContributions.map(mem => [
        mem.userName,
        mem.relationship,
        mem.totalSpent,
        `${mem.percentage}%`,
        mem.transactionCount,
      ]);

      sheetsPayload.push({
        properties: {
          title: 'Member Spending Shares',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: memHeaders.map(h => ({
                  userEnteredValue: { stringValue: h },
                  userEnteredFormat: {
                    textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                    backgroundColor: { red: 0.2, green: 0.4, blue: 0.2 },
                  },
                })),
              },
              ...memRows.map(row => ({
                values: row.map(val => {
                  if (typeof val === 'number') {
                    return {
                      userEnteredValue: { numberValue: val },
                    };
                  }
                  return {
                    userEnteredValue: { stringValue: String(val) },
                  };
                }),
              })),
            ],
          },
        ],
      });
    }
  }

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || `KinFinance Family Ledger (${new Date().toISOString().slice(0, 10)})`,
      },
      sheets: sheetsPayload,
    }),
  });

  if (!createRes.ok) {
    const errorBody = await createRes.text();
    throw new Error(`Failed to create Google Sheet: ${createRes.statusText} (${errorBody})`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return {
    spreadsheetId,
    spreadsheetUrl,
  };
}

/**
 * Appends transactions to an existing Google Sheet tab
 */
export async function appendTransactionsToSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  transactions: Transaction[]
): Promise<{ updatedRows: number }> {
  const rows = transactions.map(tx => [
    tx.date,
    tx.title,
    tx.type.toUpperCase(),
    tx.categoryName,
    tx.amount,
    tx.userName,
    tx.status.toUpperCase(),
    tx.receiptUrl ? 'YES' : 'NO',
    tx.receiptFileName || '',
    tx.notes || '',
    tx.reviewedByName || '',
    tx.reviewNotes || '',
    tx.id,
  ]);

  const range = `${sheetTitle}!A:M`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: rows,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to append to Google Sheet: ${res.statusText} (${errorBody})`);
  }

  const data = await res.json();
  return { updatedRows: data.updates?.updatedRows || rows.length };
}

/**
 * Reads range values from a Google Spreadsheet
 */
export async function readSpreadsheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<any[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to read values from Google Sheet: ${res.statusText} (${errorBody})`);
  }

  const data = await res.json();
  return data.values || [];
}

/**
 * Parses raw 2D spreadsheet values into structured candidate transactions for importing
 */
export function parseSheetRowsToTransactions(rows: any[][]): Array<{
  date: string;
  title: string;
  amount: number;
  type: 'expense' | 'income';
  categoryName: string;
  notes?: string;
}> {
  if (!rows || rows.length <= 1) return [];

  const headers = rows[0].map((h: any) => String(h || '').trim().toLowerCase());

  // Find column indices
  const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('day') || h.includes('time'));
  const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('desc') || h.includes('vendor') || h.includes('item') || h.includes('name'));
  const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('cost') || h.includes('price') || h.includes('total') || h.includes('$'));
  const typeIdx = headers.findIndex(h => h.includes('type'));
  const categoryIdx = headers.findIndex(h => h.includes('cat') || h.includes('group') || h.includes('tag'));
  const notesIdx = headers.findIndex(h => h.includes('note') || h.includes('memo') || h.includes('comment'));

  const parsed: Array<{
    date: string;
    title: string;
    amount: number;
    type: 'expense' | 'income';
    categoryName: string;
    notes?: string;
  }> = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rawTitle = titleIdx >= 0 && row[titleIdx] ? String(row[titleIdx]).trim() : row[0] ? String(row[0]).trim() : '';
    if (!rawTitle) continue;

    // Parse amount
    let rawAmountStr = amountIdx >= 0 && row[amountIdx] !== undefined ? String(row[amountIdx]) : '0';
    rawAmountStr = rawAmountStr.replace(/[^0-9.-]/g, '');
    const amountNum = Math.abs(parseFloat(rawAmountStr) || 0);

    // Parse date
    let dateStr = dateIdx >= 0 && row[dateIdx] ? String(row[dateIdx]).trim() : new Date().toISOString().slice(0, 10);
    // Simple format normalizer
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        // MM/DD/YYYY or DD/MM/YYYY
        const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        const m = parts[0].padStart(2, '0');
        const d = parts[1].padStart(2, '0');
        dateStr = `${y}-${m}-${d}`;
      }
    }

    // Parse type
    const rawType = typeIdx >= 0 && row[typeIdx] ? String(row[typeIdx]).toLowerCase() : '';
    const type: 'expense' | 'income' = rawType.includes('income') || rawType.includes('deposit') ? 'income' : 'expense';

    // Parse category
    const catName = categoryIdx >= 0 && row[categoryIdx] ? String(row[categoryIdx]).trim() : 'General Expense';
    const notes = notesIdx >= 0 && row[notesIdx] ? String(row[notesIdx]).trim() : undefined;

    parsed.push({
      date: dateStr,
      title: rawTitle,
      amount: amountNum,
      type,
      categoryName: catName,
      notes,
    });
  }

  return parsed;
}
