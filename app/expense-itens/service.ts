import { ExpenseType } from "../expense-types/service";

const EXPENSE_ITEM_API = 'http://127.0.0.1:3000/expense-item';
const LOAD_EXPENSE_API = 'http://localhost:3000/load-expense';

export type ExpenseItem = {
  id: number;
  description: string;
  date: string;
  value: number;
  expenseType: ExpenseType;
};

export async function uploadExpensePdf(file: File) {
  const body = new FormData();
  body.append('file', file);

  const response = await fetch(LOAD_EXPENSE_API, {
    method: 'POST',
    body,
  });
  if (!response.ok) throw new Error(`Upload failed (${response.status})`);
}

export async function fetchExpenseItemData() {
  try {
    const response = await fetch(EXPENSE_ITEM_API);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) { 
    console.error('Fetch error:', error);
  }
}

export async function updateExpenseItemData(body: string, expenseItemId: number | null) {
  const url = expenseItemId ? `${EXPENSE_ITEM_API}/${expenseItemId}` : EXPENSE_ITEM_API;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  if (!response.ok) throw new Error('Network response was not ok');
  return await response.json();
}

export async function deleteExpenseItem(expenseItemId: number | null) {
  if (expenseItemId) {
    const response = await fetch(`${EXPENSE_ITEM_API}/${expenseItemId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  }
}