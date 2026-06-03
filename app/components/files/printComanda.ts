// utils/printComanda.ts
// Funções de impressão reutilizáveis para comanda de cozinha e recibo.
// Uso:
//   import { printCozinha, printRecibo } from "@/utils/printComanda";
//   printCozinha(comanda, itensSelecionados);
//   printRecibo(comanda);

import { Comanda } from "@/types/comanda";

export function printCozinha(
  comanda: Comanda,
  itensSelecionados: Record<string, boolean>
) {
  const itens = comanda.itens.filter(
    (_, idx) => itensSelecionados[`${comanda.id}-${idx}`] ?? true
  );

  const win = window.open("", "_blank", "width=400,height=600");
  if (!win) return;

  win.document.write(`
    <html>
      <head>
        <title>Comanda Cozinha - ${comanda.nome}</title>
        <style>
          body { font-family: monospace; font-size: 14px; width: 58mm; }
          h1 { text-align: center; font-size: 16px; margin-bottom: 10px; }
          .line { border-top: 1px dashed #000; margin: 5px 0; }
          .item { margin-bottom: 5px; }
          .footer { text-align: center; margin-top: 15px; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>COMANDA COZINHA</h1>
        <div><strong>${comanda.nome}</strong></div>
        <div>${comanda.descricao}</div>
        <div class="line"></div>
        ${itens
          .map(
            (item) =>
              `<div class="item">${item.quantidade}x ${item.nome} <strong>(${item.categoria_nome ?? ""})</strong></div>`
          )
          .join("")}
        <div class="line"></div>
        <div class="footer">Preparar conforme pedido!</div>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

export function printRecibo(comanda: Comanda) {
  const total = comanda.itens.reduce(
    (acc, item) =>
      acc + (item.porPeso ? (item.peso ?? 0) : item.quantidade) * item.preco,
    0
  );

  const win = window.open("", "_blank", "width=400,height=600");
  if (!win) return;

  win.document.write(`
    <html>
      <head>
        <title>Recibo - ${comanda.nome}</title>
        <style>
          body { font-family: monospace; font-size: 14px; width: 280px; }
          h1 { text-align: center; font-size: 16px; margin-bottom: 10px; }
          .line { border-top: 1px dashed #000; margin: 5px 0; }
          .item { display: flex; justify-content: space-between; }
          .total { font-weight: bold; text-align: right; margin-top: 10px; }
          .footer { text-align: center; margin-top: 15px; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>RECIBO</h1>
        <div><strong>${comanda.nome}</strong></div>
        <div>${comanda.descricao}</div>
        <div class="line"></div>
        ${comanda.itens
          .map((item) => {
            const subtotal = (item.porPeso ? (item.peso ?? 0) : item.quantidade) * item.preco;
            return `<div class="item">
              <span>${item.quantidade}x ${item.nome}</span>
              <span>R$${subtotal.toFixed(2)}</span>
              <strong>(${item.categoria_nome ?? ""})</strong>
            </div>`;
          })
          .join("")}
        <div class="line"></div>
        <div class="total">TOTAL: R$${total.toFixed(2)}</div>
        <div class="footer">Obrigado pela preferência!</div>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}
