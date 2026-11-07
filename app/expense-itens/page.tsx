"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { deleteExpenseItem, ExpenseItem, fetchExpenseItemData, updateExpenseItemData, uploadExpensePdf } from "./service";
import { ExpenseType, fetchExpenseTypeData } from "../expense-types/service";

const initialExpenseType: ExpenseType[] = [{id: 0, name: ""}];
const initialExpenses: ExpenseItem[] = [{
  id: 0,
  description: "",
  date: "",
  value: 0,
  expenseType: initialExpenseType[0]
}];
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

export default function ExpenseItemPage() {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [expenseTypes, setExpenseTypes] = useState(initialExpenseType);
  const [editingExpenseTypeId, setEditingExpenseTypeId] = useState("");
  const [editingExpense, setEditingExpense] = useState(initialExpenses[0]);
  const [query, setQuery] = useState("");
  const [activeExpenseType, setActiveExpenseType] = useState("All");
  const [activeMonth, setActiveMonth] = useState("All");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    async function fetchData() {
      try {
        setExpenses(await fetchExpenseItemData());
        setExpenseTypes(await fetchExpenseTypeData());
      } catch (error) {
        console.error('Fetch error:', error);
      }
    }
    fetchData();
  }, []);

  const expenseMonths = useMemo(
    () =>
      [...new Set(
        expenses
          .map((expense) => expense.date.slice(0, 7))
          .filter((month) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month)),
      )].sort().reverse(),
    [expenses],
  );
  const monthLabel =
    activeMonth === "All"
      ? "All months"
      : monthFormatter.format(new Date(`${activeMonth}-01T12:00:00`));

  const filteredExpenses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return expenses.filter((expense) => {
      const matchesQuery = expense.description
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesExpenseType = activeExpenseType === "All" 
      || expense?.expenseType?.name === activeExpenseType 
      || (activeExpenseType === "Undefined" && expense?.expenseType?.name == null);
      const matchesMonth =
        activeMonth === "All" || expense.date.startsWith(activeMonth);
      return matchesQuery && matchesExpenseType && matchesMonth;
    });
  }, [activeExpenseType, activeMonth, expenses, query]);
  const total = filteredExpenses.reduce((sum, expense) => sum + Number(expense.value), 0);

  function cancelEditing() {
    setEditingExpense(initialExpenses[0]);
    setEditingExpenseTypeId("");
  }

  function startEditing(expense: ExpenseItem) {    
    setEditingExpense(expense);
    console.log('setEditingExpense:', expense);
    if (expense?.expenseType?.id)
      setEditingExpenseTypeId(String(expense.expenseType.id));    
  }

  async function saveExpenseTypeEditing() {
    if (!editingExpenseTypeId) return;
    const body = {expenseTypeId: Number(editingExpenseTypeId)};
    await updateExpenseItemData(JSON.stringify(body), editingExpense.id);
    // console.log('save expense - editingExpense.id:', editingExpense.id);
    // console.log('save expense - editingExpenseTypeId:', editingExpenseTypeId);
    setExpenses(await fetchExpenseItemData());
    cancelEditing();
  }
  
  async function deleteExpense(id: number) {
    if (editingExpense.id === id) cancelEditing();
    await deleteExpenseItem(id);
    setExpenses(await fetchExpenseItemData());
    console.log('deleteExpense:', id);
  }

  async function handlePdfSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadMessage("Please select a PDF file.");
      return;
    }

    setUploading(true);
    setUploadMessage("");
    try {
      await uploadExpensePdf(file);
      const updatedExpenses = await fetchExpenseItemData();
      if (!Array.isArray(updatedExpenses)) {
        setUploadMessage("PDF uploaded, but expenses could not be refreshed.");
      } else {
        setExpenses(updatedExpenses);
        setUploadMessage("PDF uploaded successfully.");
      }
    } catch (error) {
      console.error("PDF upload error:", error);
      setUploadMessage("Could not upload the PDF. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#17211d]">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
        <header className="mb-10 flex items-center justify-between border-b border-[#dfe4dc] pb-5">
          <Link href="/" className="text-lg font-semibold tracking-[-0.04em]">
            x<span className="text-[#ef6f51]">·</span>penses
          </Link>
          <div className="flex items-center gap-3 text-sm text-[#68736d]">
            <span className="hidden sm:inline">Personal workspace</span>
            <span className="grid size-9 place-items-center rounded-full bg-[#d8e4da] font-semibold text-[#365443]">
              TA
            </span>
          </div>
        </header>

        <div>
          <section>
            <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#ef6f51]">
                  {monthLabel}
                </p>
                <h1 className="text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
                  Your expenses
                </h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-[#68736d]">
                  A clear view of where your money went.
                </p>
              </div>
              <div className="rounded-2xl border border-[#dfe4dc] bg-white px-5 py-4 sm:min-w-44">
                <p className="text-xs font-medium text-[#68736d]">
                  Total recorded
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                  {currency.format(total)}
                </p>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Link
                href="/expense-types"
                className="inline-flex h-11 items-center rounded-xl border border-[#dfe4dc] bg-white px-4 text-sm font-semibold text-[#365443] transition hover:border-[#789783] hover:bg-[#f0f5f1]"
              >
                Expense Types
              </Link>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handlePdfSelection}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex h-11 items-center rounded-xl border border-[#dfe4dc] bg-white px-4 text-sm font-semibold text-[#365443] transition hover:border-[#789783] hover:bg-[#f0f5f1] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload Expenses PDF"}
              </button>
              <p role="status" className="text-sm text-[#68736d]">
                {uploadMessage}
              </p>
            </div>

            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
              <label className="relative block flex-1">
                <span className="sr-only">Search expenses</span>
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8a958e]">
                  ⌕
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search expenses"
                  className="h-12 w-full rounded-xl border border-[#dfe4dc] bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#789783] focus:ring-2 focus:ring-[#d8e4da]"
                />
              </label>
              <select
                aria-label="Filter by type"
                value={activeExpenseType}
                onChange={(event) => setActiveExpenseType(event.target.value)}
                className="h-12 rounded-xl border border-[#dfe4dc] bg-white px-4 text-sm outline-none focus:border-[#789783] focus:ring-2 focus:ring-[#d8e4da]"
              >
                <option>All</option>
                <option>Undefined</option>
                {expenseTypes.map((expenseType) => (
                  <option key={expenseType.id}>{expenseType.name}</option>
                ))}
              </select>
              <select
                aria-label="Filter by month"
                value={activeMonth}
                onChange={(event) => setActiveMonth(event.target.value)}
                className="h-12 rounded-xl border border-[#dfe4dc] bg-white px-4 text-sm outline-none focus:border-[#789783] focus:ring-2 focus:ring-[#d8e4da]"
              >
                <option value="All">All months</option>
                {expenseMonths.map((month) => (
                  <option key={month} value={month}>
                    {monthFormatter.format(new Date(`${month}-01T12:00:00`))}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#dfe4dc] bg-white">
              <div className="hidden grid-cols-[1fr_220px_120px_100px_72px] gap-4 border-b border-[#edf0eb] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#8a958e] sm:grid">
                <span>Description</span>
                <span>Type</span>
                <span>Date</span>
                <span>Value</span>
                <span />
              </div>
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => (
                  <article
                    key={expense.id}
                    className="relative grid gap-3 border-b border-[#edf0eb] px-5 py-4 last:border-0 sm:grid-cols-[1fr_220px_120px_100px_72px] sm:items-center sm:gap-4"
                  >
                    <div>
                      <p className="font-medium">{expense.description}</p>
                    </div>
                    {editingExpense.id === expense.id ? (
                      <div className="flex items-center gap-3">
                        <select
                          aria-label={`Edit type for ${expense.description}`}
                          autoFocus
                          value={editingExpenseTypeId}
                          onChange={(event) =>
                            setEditingExpenseTypeId(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") saveExpenseTypeEditing();
                            if (event.key === "Escape") cancelEditing();
                          }}
                          className="h-10 w-full rounded-lg border border-[#789783] bg-white px-3 text-sm text-[#17211d] outline-none ring-2 ring-[#d8e4da]"
                        >
                          {expenseTypes.map((expenseType) => (
                            <option
                              key={String(expenseType.id)}
                              value={String(expenseType.id)}
                            >
                              {expenseType.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={saveExpenseTypeEditing}
                          className="text-xs font-semibold text-[#68736d] transition hover:text-[#365443]"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="text-xs font-semibold text-[#68736d] transition hover:text-[#c54c35]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditing(expense)}
                        className="text-left text-sm text-[#68736d] transition hover:text-[#365443]"
                      >
                        {expense?.expenseType?.name || "Select"}
                      </button>
                    )}
                    <span className="hidden text-sm text-[#68736d] sm:block">
                      {new Date(`${expense.date}T12:00:00`).toLocaleDateString(
                        "pt-BR",
                        { month: "short", day: "numeric" },
                      )}
                    </span>
                    <span className="absolute right-5 top-5 text-sm font-semibold sm:static">
                      {currency.format(expense.value)}
                    </span>
                    <div className="flex text-xs font-semibold text-[#68736d] sm:justify-end">
                      <button
                        type="button"
                        onClick={() => deleteExpense(expense.id)}
                        className="transition hover:text-[#c54c35]"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="px-5 py-14 text-center text-sm text-[#68736d]">
                  No expenses match this view.
                </div>
              )}
            </div>
            <p className="mt-4 text-xs text-[#8a958e]">
              Showing {filteredExpenses.length} of {expenses.length} expenses
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
