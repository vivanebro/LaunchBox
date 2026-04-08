// Built-in example template so new users immediately see what a filled cost calculator looks like.
// Used in both the dropdown (CostCalculatorPanel) and the template management page (CostCalculator).

export const EXAMPLE_TEMPLATE_ID = '__example__';

export const EXAMPLE_TEMPLATE = {
  id: EXAMPLE_TEMPLATE_ID,
  name: 'Example: Home Renovation Project',
  body: {
    categories: [
      { id: 'time', name: 'Your Time', type: 'time', qty: '5', unit: 'days', rate: '500', amount: 2500 },
      { id: 'team', name: 'Team / Subcontractors', type: 'amount', amount: 2400 },
      { id: 'equipment', name: 'Equipment / Rentals', type: 'amount', amount: 800 },
      { id: 'travel', name: 'Travel / Location', type: 'amount', amount: 150 },
      { id: 'materials', name: 'Materials & Licenses', type: 'amount', amount: 1200 },
      { id: 'software', name: 'Software', type: 'amount', amount: 0 },
      { id: 'other', name: 'Other', type: 'amount', amount: 200 },
    ],
    marginPercent: 30,
    hasOpened: true,
  },
  currency: 'USD',
};
