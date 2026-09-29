'use strict';

export function validateBackup(data) {
  if (!data || data.format !== 'cuentasplus-backup' || data.version !== 1 ||
    !Array.isArray(data.clients) || !data.business || typeof data.business !== 'object')
    throw new Error('El archivo no es una copia válida de Cuentas+.');
  for (const field of ['name', 'phone', 'address']) {
    if (typeof data.business[field] !== 'string')
      throw new Error('La copia no contiene los datos del negocio en un formato válido.');
  }

  const names = new Set();
  const clients = data.clients.map((client) => {
    if (!client || typeof client.name !== 'string' || !client.name.trim())
      throw new Error('La copia contiene un cliente sin nombre válido.');
    const name = client.name.trim();
    if (names.has(name)) throw new Error(`La copia contiene clientes duplicados: ${name}.`);
    names.add(name);

    const balance = Number(client.balance);
    if (!Number.isFinite(balance) || balance < 0)
      throw new Error(`El saldo de ${name} no es válido.`);
    if (!Array.isArray(client.transactions))
      throw new Error(`Las transacciones de ${name} no tienen un formato válido.`);

    const transactions = client.transactions.map((transaction) => {
      if (!transaction || !['purchase', 'payment', 'Compra', 'Pago'].includes(transaction.type))
        throw new Error(`La copia contiene una transacción inválida para ${name}.`);
      const amount = Number(transaction.amount);
      if (!Number.isFinite(amount) || amount <= 0 || typeof transaction.date !== 'string' || !transaction.date)
        throw new Error(`La copia contiene un monto o fecha inválidos para ${name}.`);
      return {
        ...transaction,
        type: transaction.type === 'Compra' ? 'purchase' : transaction.type === 'Pago' ? 'payment' : transaction.type,
        amount,
        paymentMethod: typeof transaction.paymentMethod === 'string' ? transaction.paymentMethod : '-'
      };
    });

    return {
      name,
      phone: typeof client.phone === 'string' ? client.phone : '-',
      street: typeof client.street === 'string' ? client.street : '-',
      number: typeof client.number === 'string' ? client.number : '-',
      balance,
      transactions
    };
  });
  return { business: data.business, clients };
}
