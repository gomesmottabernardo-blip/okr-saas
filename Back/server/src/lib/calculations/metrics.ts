export function calculateMRR(clients: any[]) {

  return clients
    .filter(client => client.active)
    .reduce((total, client) => {
      return total + client.monthlyValue
    }, 0)

}


export function calculateAverageTicket(mrr: number, clients: number) {

  if (clients === 0) {
    return 0
  }

  return mrr / clients

}


export function calculateMargin(revenue: number, cost: number) {

  if (revenue === 0) {
    return 0
  }

  return (revenue - cost) / revenue

}


export function calculateLTV(ticket: number, lifetimeMonths: number) {

  return ticket * lifetimeMonths

}


export function calculateChurn(lostClients: number, totalClients: number) {

  if (totalClients === 0) {
    return 0
  }

  return lostClients / totalClients

}