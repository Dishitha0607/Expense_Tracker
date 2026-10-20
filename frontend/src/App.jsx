
import { useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./App.css";

const API = "http://localhost:5000/api/transactions";

const COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
];

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("Food");

  async function fetchTransactions() {
    try {
      setError("");
      const response = await axios.get(API);
      setTransactions(response.data);
    } catch (err) {
      setError("Could not load transactions. Check your backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTransactions();
  }, []);

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = income - expenses;

  // Data for the income vs expenses chart
  const comparisonData = [
    { name: "Money", Income: income, Expenses: expenses },
  ];

  // Group expenses by category for the pie chart
  const categoryData = Object.values(
    transactions
      .filter((t) => t.type === "expense")
      .reduce((groups, t) => {
        const categoryName = t.category || "Other";

        if (!groups[categoryName]) {
          groups[categoryName] = {
            name: categoryName,
            value: 0,
          };
        }

        groups[categoryName].value += Number(t.amount);
        return groups;
      }, {})
  );

  async function addTransaction(e) {
    e.preventDefault();

    try {
      await axios.post(API, {
        title,
        amount: Number(amount),
        type,
        category,
        date: new Date().toISOString(),
      });

      setTitle("");
      setAmount("");
      await fetchTransactions();
    } catch (err) {
      setError(err.response?.data?.message || "Could not add transaction.");
    }
  }

  async function deleteTransaction(id) {
    try {
      await axios.delete(`${API}/${id}`);
      await fetchTransactions();
    } catch (err) {
      setError("Could not delete transaction.");
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Expense Tracker</h1>
        <p>Manage your money, one transaction at a time.</p>
      </header>

      <section className="summary">
        <div className="card">
          <h3>Total Balance</h3>
          <h2>₹{balance.toFixed(2)}</h2>
        </div>

        <div className="card">
          <h3>Total Income</h3>
          <h2 className="income">₹{income.toFixed(2)}</h2>
        </div>

        <div className="card">
          <h3>Total Expenses</h3>
          <h2 className="expense">₹{expenses.toFixed(2)}</h2>
        </div>
      </section>

      {/* Charts */}
      <section className="charts-section">
        <h2>Spending Insights</h2>

        <div className="charts-grid">
          <div className="chart-card">
            <h3>Income vs. Expenses</h3>

            {transactions.length === 0 ? (
              <p>Add transactions to see your chart.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) =>
                      `₹${Number(value).toFixed(2)}`
                    }
                  />
                  <Legend />
                  <Bar dataKey="Income" fill="#10b981" />
                  <Bar dataKey="Expenses" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="chart-card">
            <h3>Expenses by Category</h3>

            {categoryData.length === 0 ? (
              <p>Add an expense to see category breakdown.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) =>
                      `₹${Number(value).toFixed(2)}`
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className="transactions">
        <h2>Add Transaction</h2>

        <form onSubmit={addTransaction} className="transaction-form">
          <input
            placeholder="Transaction title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Amount (₹)"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Food</option>
            <option>Travel</option>
            <option>Shopping</option>
            <option>Salary</option>
            <option>Education</option>
            <option>Other</option>
          </select>

          <button type="submit">Add Transaction</button>
        </form>

        {error && <p className="error">{error}</p>}
      </section>

      <section className="transactions">
        <h2>Recent Transactions</h2>

        {loading ? (
          <p>Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p>No transactions yet. Add one above!</p>
        ) : (
          transactions.map((t) => (
            <div className="transaction" key={t._id}>
              <div>
                <strong>{t.title}</strong>
                <p>{t.category} · {t.type}</p>
              </div>

              <div className="transaction-actions">
                <strong className={t.type === "income" ? "income" : "expense"}>
                  {t.type === "income" ? "+" : "-"}₹
                  {Number(t.amount).toFixed(2)}
                </strong>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deleteTransaction(t._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default App;
