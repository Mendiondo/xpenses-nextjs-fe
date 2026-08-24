const EXPENSE_TYPE_API = 'http://127.0.0.1:3000/expense-type';

export type ExpenseType = {
  id: number;
  name: string;
};

export async function fetchExpenseTypeData() {
  try {
    const response = await fetch(EXPENSE_TYPE_API);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) { 
    console.error('Fetch error:', error);
  }
}

export async function postExpenseTypeData(method: string, body: string, editingId: number | null) {
  const url = editingId ? `${EXPENSE_TYPE_API}/${editingId}` : EXPENSE_TYPE_API;
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  if (!response.ok) throw new Error('Network response was not ok');
  return await response.json();
}