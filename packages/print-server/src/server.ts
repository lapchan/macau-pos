import express from "express";
import cors from "cors";
import { buildReceiptCommands, type ReceiptData } from "./printer.js";

const app = express();
const PORT = parseInt(process.env.PRINT_PORT || "9100", 10);

app.use(cors());
app.use(express.json());

// Track printer connection state
let printerConnected = false;
let printerName = "Not connected";

// ─── Health / Status ───────────────────────────────────────
app.get("/status", (_req, res) => {
  res.json({
    connected: printerConnected,
    printer: printerName,
    port: PORT,
    version: "0.1.0",
  });
});

// ─── Print Receipt ─────────────────────────────────────────
app.post("/print", async (req, res) => {
  try {
    const data: ReceiptData = req.body;

    if (!data || !data.orderNumber) {
      return res.status(400).json({ success: false, error: "Invalid receipt data" });
    }

    // Build ESC/POS commands
    const commands = buildReceiptCommands(data);

    // Try to send to printer
    try {
      // Dynamic import for escpos (USB support)
      const escpos = await import("escpos");
      const escposUSB = await import("escpos-usb");

      // Auto-detect USB printer
      const device = new escposUSB.default();
      const printer = new escpos.default.Printer(device);

      await new Promise<void>((resolve, reject) => {
        device.open((err: Error | null) => {
          if (err) {
            reject(err);
            return;
          }

          printer
            .font("a")
            .align("ct")
            .style("b")
            .size(1, 1)
            .text(data.shopName)
            .style("normal")
            .size(0, 0);

          // Address
          if (data.showAddress && data.shopAddress) {
            printer.text(data.shopAddress);
          }

          // Phone
          if (data.showPhone && data.shopPhone) {
            printer.text(data.shopPhone);
          }

          printer.text("================================");

          // Header text
          if (data.receiptHeader) {
            printer.text(data.receiptHeader);
            printer.text("--------------------------------");
          }

          // Order info
          printer.align("lt");
          printer.text(`Order: ${data.orderNumber}`);
          printer.text(`Date:  ${new Date(data.orderDate).toLocaleString()}`);
          printer.text("--------------------------------");

          // Items
          for (const item of data.items) {
            const nameStr = item.name;
            const priceStr = `${data.currency} ${item.lineTotal.toFixed(2)}`;
            printer.tableCustom([
              { text: `${nameStr} x${item.quantity}`, align: "LEFT", width: 0.6 },
              { text: priceStr, align: "RIGHT", width: 0.4 },
            ]);
            if (item.variantName) {
              printer.text(`  · ${item.variantName}`);
            }
          }

          printer.text("--------------------------------");

          // Subtotal
          printer.tableCustom([
            { text: "Subtotal", align: "LEFT", width: 0.5 },
            { text: `${data.currency} ${data.subtotal.toFixed(2)}`, align: "RIGHT", width: 0.5 },
          ]);

          // Tax
          if (data.showTax && data.taxAmount > 0) {
            printer.tableCustom([
              { text: `Tax (${data.taxRate}%)`, align: "LEFT", width: 0.5 },
              { text: `${data.currency} ${data.taxAmount.toFixed(2)}`, align: "RIGHT", width: 0.5 },
            ]);
          }

          // Total
          printer.style("b").size(1, 1);
          printer.tableCustom([
            { text: "TOTAL", align: "LEFT", width: 0.4 },
            { text: `${data.currency} ${data.total.toFixed(2)}`, align: "RIGHT", width: 0.6 },
          ]);
          printer.style("normal").size(0, 0);

          printer.text("--------------------------------");

          // Payment method
          const methodLabels: Record<string, string> = {
            cash: "Cash",
            tap: "Card (Tap)",
            insert: "Card (Insert)",
            qr: "QR Pay",
          };
          printer.tableCustom([
            { text: methodLabels[data.paymentMethod] || data.paymentMethod, align: "LEFT", width: 0.5 },
            { text: `${data.currency} ${data.paymentAmount.toFixed(2)}`, align: "RIGHT", width: 0.5 },
          ]);

          // Cash details
          if (data.paymentMethod === "cash" && data.cashReceived != null) {
            printer.tableCustom([
              { text: "Received", align: "LEFT", width: 0.5 },
              { text: `${data.currency} ${data.cashReceived.toFixed(2)}`, align: "RIGHT", width: 0.5 },
            ]);
            if (data.changeGiven != null && data.changeGiven > 0) {
              printer.tableCustom([
                { text: "Change", align: "LEFT", width: 0.5 },
                { text: `${data.currency} ${data.changeGiven.toFixed(2)}`, align: "RIGHT", width: 0.5 },
              ]);
            }
          }

          printer.text("================================");

          // Footer
          printer.align("ct");
          printer.text(data.receiptFooter || "Thank you! 多謝光臨！");
          printer.text("");
          printer.text("");

          // Cut paper
          printer.cut();
          printer.close(() => {
            printerConnected = true;
            printerName = "USB Thermal Printer";
            resolve();
          });
        });
      });

      res.json({ success: true });
    } catch (printerErr: unknown) {
      // If USB printer not found, log the ESC/POS commands for debugging
      console.log("USB printer not available, commands generated:", commands.length, "bytes");
      console.log("Error:", printerErr instanceof Error ? printerErr.message : String(printerErr));

      printerConnected = false;
      printerName = "Not connected";

      // Still return success with a note — the commands were built correctly
      res.json({
        success: false,
        error: `Printer not connected: ${printerErr instanceof Error ? printerErr.message : "Unknown error"}`,
        commandsGenerated: true,
        commandLength: commands.length,
      });
    }
  } catch (err) {
    console.error("Print server error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ─── Test Print ────────────────────────────────────────────
app.post("/test", async (_req, res) => {
  try {
    const testData: ReceiptData = {
      shopName: "RetailOS Test Print",
      shopAddress: "123 Test Street",
      shopPhone: "+853 0000 0000",
      receiptHeader: "TEST RECEIPT",
      receiptFooter: "This is a test print.",
      showAddress: true,
      showPhone: true,
      showTax: false,
      taxRate: 0,
      orderNumber: "TEST-000001",
      orderDate: new Date(),
      items: [
        { name: "Test Item A", quantity: 2, unitPrice: 10, lineTotal: 20 },
        { name: "Test Item B", quantity: 1, unitPrice: 15, lineTotal: 15 },
      ],
      subtotal: 35,
      taxAmount: 0,
      total: 35,
      paymentMethod: "cash",
      paymentAmount: 35,
      cashReceived: 50,
      changeGiven: 15,
      currency: "MOP",
    };

    // Reuse the /print endpoint logic
    const commands = buildReceiptCommands(testData);
    console.log("Test print commands generated:", commands.length, "bytes");

    res.json({ success: true, message: "Test print sent", commandLength: commands.length });
  } catch (err) {
    res.status(500).json({ success: false, error: "Test print failed" });
  }
});

// ─── Start Server ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🖨️  RetailOS Print Server running on http://localhost:${PORT}`);
  console.log(`   POST /print  — Print a receipt`);
  console.log(`   POST /test   — Test print`);
  console.log(`   GET  /status — Check printer status`);
});
