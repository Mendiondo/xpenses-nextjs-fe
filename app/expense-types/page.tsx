"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExpenseType, fetchExpenseTypeData, postExpenseTypeData } from "./service";

const initialExpenseType: ExpenseType[] = [
  {
    id: 0,
    name: "",
  }
];

const emptyForm = { name: "" };

export default function ExpenseItemPage() {
  const [expenseType, setExpenseType] = useState(initialExpenseType);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => { 
    async function fetchData() {
      try {
        setExpenseType(await fetchExpenseTypeData());
      } catch (error) {
        console.error('Fetch error:', error);
      }
    }
    fetchData();
  }, []);

  const filteredExpenseType = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return expenseType.filter((expenseType) => {
      return expenseType.name
      .toLowerCase()
      .includes(normalizedQuery);
    });
  }, [expenseType, query]);

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function postData(method: string, entry: string) {
    const response = await postExpenseTypeData(method, entry, editingId);
    if (response)
      setExpenseType(await fetchExpenseTypeData());
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) return;
    const entry = {
      name: form.name.trim(),
    };
    if (editingId !== null) {
      postData('PATCH', JSON.stringify(entry));
    } else {
      postData('POST', JSON.stringify(entry));
    }
    cancelEditing();
  }

  function startEditing(expenseType: ExpenseType) {
    setEditingId(expenseType.id);
    setForm({
      name: expenseType.name,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteExpense(id: number) {
    setExpenseType((current) => current.filter((expense) => expense.id !== id));
    if (editingId === id) cancelEditing();
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

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-start">
          <section>
            <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#ef6f51]">
                  August 2026
                </p>
                <h1 className="text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
                  Expenses Types
                </h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-[#68736d]">
                  The type of expenses used to classify what you spent.
                </p>
              </div>              
            </div>

            <div className="mb-4 flex">
              <Link
                href="/expense-itens"
                className="inline-flex h-11 items-center rounded-xl border border-[#dfe4dc] bg-white px-4 text-sm font-semibold text-[#365443] transition hover:border-[#789783] hover:bg-[#f0f5f1]"
              >
                Expenses
              </Link>
            </div>

            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
              <label className="relative block flex-1">
                <span className="sr-only">Search expense type</span>
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
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#dfe4dc] bg-white">
              <div className="hidden grid-cols-[1fr_150px_120px_100px_72px] gap-4 border-b border-[#edf0eb] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#8a958e] sm:grid">
                <span>Name</span>              
                <span />
              </div>
              {filteredExpenseType.length > 0 ? (
                filteredExpenseType.map((expenseType) => (
                  <article
                    key={expenseType.id}
                    className="relative grid gap-3 border-b border-[#edf0eb] px-5 py-4 last:border-0 sm:grid-cols-[1fr_150px_120px_100px_72px] sm:items-center sm:gap-4"
                  >
                    <div>
                      <p className="font-medium">{expenseType.name}</p>
                    </div>
                    <div className="flex gap-3 text-xs font-semibold text-[#68736d] sm:justify-end">
                      <button
                        type="button"
                        onClick={() => startEditing(expenseType)}
                        className="transition hover:text-[#365443]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteExpense(expenseType.id)}
                        className="transition hover:text-[#c54c35]"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="px-5 py-14 text-center text-sm text-[#68736d]">
                  No expense types match this view.
                </div>
              )}
            </div>
            <p className="mt-4 text-xs text-[#8a958e]">
              Showing {filteredExpenseType.length} of {expenseType.length} expense types
            </p>
          </section>

          <aside className="rounded-2xl bg-[#18352a] p-6 text-white shadow-[0_18px_50px_rgba(24,53,42,0.12)] lg:sticky lg:top-8">
            <div className="mb-7 flex items-start justify-between">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#f1a28e]">
                  {editingId !== null ? "Update entry" : "New entry"}
                </p>
                <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                  {editingId !== null ? "Edit expense" : "Add an expense type"}
                </h2>
              </div>
              <span className="text-2xl text-[#f1a28e]">＋</span>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-xs font-medium text-[#b8c8bd]">
                Name
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="e.g. food"
                  className="mt-2 h-11 w-full rounded-lg border border-[#406151] bg-[#24483a] px-3 text-sm text-white outline-none placeholder:text-[#8da597] focus:border-[#f1a28e]"
                />
              </label>
              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="h-11 flex-1 rounded-lg bg-[#f1a28e] px-4 text-sm font-bold text-[#18352a] transition hover:bg-[#ffc0ad]"
                >
                  {editingId !== null ? "Save changes" : "Add expense type"}
                </button>
                {editingId !== null && (
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="h-11 rounded-lg border border-[#527363] px-4 text-sm font-semibold text-white transition hover:bg-[#24483a]"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
            <p className="mt-6 border-t border-[#315645] pt-5 text-xs leading-5 text-[#8da597]">
              Keep your entries light and specific. You can update or remove
              anything later.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
