const transcationModel = require("../models/transcation.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");

// validating request

async function createTranscation(req, res) {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;
  if (!fromAccount || !toAccount || !amount | !idempotencyKey) {
    return res.status(400).json({ message: "fromAccount, toAccount, amount, idempotencyKey are required" });
  }

  const fromUserAccount = await accountModel.findOne({
    _id: fromAccount,
  });

  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });

  if (!fromUserAccount || !toUserAccount) {
    return res.status(400).json({ message: "These fields are required" });
  }

  // validating idempotency key

  const isTranscationAlreadyExists = await transcationModel.findOne({
    idempotencyKey: idempotencyKey,
  });

  if (isTranscationAlreadyExists) {
    if (isTranscationAlreadyExists === "COMPLETED") {
      return res.status(200).json({ message: "Transcation Successful", transcation: isTranscationAlreadyExists });
    }

    if (isTranscationAlreadyExists === "PENDING") {
      return res.status(200).json({
        message: "Transcation is Pending",
      });
    }

    if (isTranscationAlreadyExists === "FAILED") {
      return res.status(500).json({
        message: "Transcation Failed",
      });
    }

    if (isTranscationAlreadyExists === "REVERSED") {
      return res.status(500).json({ message: "Transcation reversed, Please Retry" });
    }
  }

  //checking account status

  if (fromUserAccount != "ACTIVE" || toUserAccount != "ACTIVE") {
    return res.status(400).json({ message: "Transcation failed, The accounts must be Active" });
  }

  //deriving sender balance from ledger

  const balance = await fromUserAccount.getBalance();
  if (balance < amount) {
    return res.status(400).json({ message: "Insufficient Balance. Current balance is ${balance}" });
  }
  let transcation;
  try {
    //Create Transcation

    const session = await mongoose.startSession();
    session.startTranscation();

    transcation = (
      await transcationModel.create(
        {
          fromAccount: fromUserAccount._id,
          toAccount,
          amount,
          idempotencyKey,
          status: "PENDING",
        },
        { session },
      )
    )[0];
    const debitLedgerEntry = await ledgerModel.create(
      [
        {
          account: fromAccount,
          amount: amount,
          transcation: transcation._id,
          type: "DEBIT",
        },
      ],
      { session },
    );
    await (() => {
      return new Promise((resolve) => setTimeout(resolve, 10 * 1000));
    })();
    const creditLedgerEntry = await ledgerModel.create(
      [
        {
          account: toAccount,
          amount: amount,
          transcation: transcation._id,
          type: "CREDIT",
        },
      ],
      { session },
    );
    await transcationModel.findOneAndUpdate(
      {
        _id: transcation._id,
      },
      {
        status: "COMPLETED",
      },
      { session },
    );

    await session.commitTranscation();
    session.endSession();
  } catch (error) {
    return res.status(400).json({
      message: " Transcation Pending due to internal error",
    });
  }
  // Email verify

  await emailService.sendTranscationEmail(req.user.email, req.user.name, amount, toAccount);
  return res.status(201).json({
    message: "Transcation completed Successfully",
    transcation: transcation,
  });
}

//creating initial funds
async function createInitialFundsTranscation(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;
  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({ message: "The fields are required" });
  }
  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });
  if (!toUserAccount) {
    return res.status(400).json({ message: "Invalid account" });
  }
  const fromUserAccount = await accountModel.findOne({
    user: req.user._id,
  });
  if (!fromUserAccount) {
    return res.status(400).json({ message: "Invalid account" });
  }
  const session = await mongoose.startSession();
  session.startTranscation();

  const transcation = (
    await transcationModel.create(
      {
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING",
      },
      { session },
    )
  )[0];
  const debitLedgerEntry = await ledgerModel.create(
    [
      {
        account: fromAccount,
        amount: amount,
        transcation: transcation._id,
        type: "DEBIT",
      },
    ],
    { session },
  );
  await (() => {
    return new Promise((resolve) => setTimeout(resolve, 20 * 1000));
  })();
  const creditLedgerEntry = await ledgerModel.create(
    [
      {
        account: toAccount,
        amount: amount,
        transcation: transcation._id,
        type: "CREDIT",
      },
    ],
    { session },
  );
  await transcationModel.findOneAndUpdate(
    {
      _id: transcation._id,
    },
    {
      status: "COMPLETED",
    },
    { session },
  );

  await session.commitTranscation();
  session.endSession();
  return res.status(201).json({
    message: "Initial funds transcation completed successfully",
    transcation: transcation,
  });
}
module.exports = {
  createTranscation,
  createInitialFundsTranscation,
};
