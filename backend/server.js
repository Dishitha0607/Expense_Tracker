const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Transaction = require("./models/Transaction");
require("dotenv").config();

const app = express();
app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json()); //middleware

app.get("/",(req,res) => {
  res.json({message: "Expense Tracker API is running"})
})

app.get("/api/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//1. Get all the transactions
app.get("/api/transactions/summary", async (req, res) => {
  try {
    const { month } = req.query;
    let filter = {};

    if (month) {
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({
          message: "Month must be in YYYY-MM format"
        });
      }

      const startDate = new Date(`${month}-01T00:00:00.000Z`);

      if (
        Number.isNaN(startDate.getTime()) ||
        startDate.toISOString().slice(0, 7) !== month
      ) {
        return res.status(400).json({
          message: "Invalid month"
        });
      }

      const endDate = new Date(startDate);
      endDate.setUTCMonth(endDate.getUTCMonth() + 1);

      filter.date = {
        $gte: startDate,
        $lt: endDate
      };
    }

    const transactions = await Transaction.find(filter);

    const income = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//2. POST new transaction
app.post("/api/transactions",async(req,res)=>{
  try{
    const transaction = new Transaction(req.body);
    const savedTransaction = await transaction.save();
    res.status(201).json(savedTransaction);
  }catch(err){
    res.status(400).json({message:err.message});
  }
})

//PUT update a transaction
app.put("/api/transactions/:id", async(req,res)=>{
  try{
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id, //id of the transaction that needs to be updated
      req.body,
      {new:true, runValidators:true}
    );

    //if the id isn't found
    if(!updatedTransaction){
      return res.status(404).json({message:"Transaction not found"});
    }
    res.json(updatedTransaction);
  }catch(err){
    res.status(400).json({message:err.message});
  }
});

//DELETE a transaction
app.delete("/api/transactions/:id", async (req, res) => {
  try {
    const deletedTransaction =
      await Transaction.findByIdAndDelete(req.params.id);

    if (!deletedTransaction) {
      return res.status(404).json({
        message: "Transaction not found"
      });
    }

    res.json({
      message: "Transaction deleted successfully"
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//Connection to MongoDB & start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected")

    app.listen(5000, ()=>{
      console.log("Server running on port 5000")
    });
  })

  .catch((err) => {
    console.log("MonogDB connection error:",err.message);
  });