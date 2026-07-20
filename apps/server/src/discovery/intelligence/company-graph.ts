export interface CompanyGraphNode {
  company: string;
  peers: string[];
  industry: string;
}

export const COMPANY_GRAPH: Record<string, CompanyGraphNode> = {
  Razorpay: {
    company: 'Razorpay',
    peers: ['PhonePe', 'Cashfree', 'Juspay', 'Open', 'Pine Labs'],
    industry: 'Fintech',
  },
  PhonePe: {
    company: 'PhonePe',
    peers: ['Razorpay', 'Cashfree', 'Juspay', 'Pine Labs'],
    industry: 'Fintech',
  },
  Cashfree: {
    company: 'Cashfree',
    peers: ['Razorpay', 'PhonePe', 'Juspay'],
    industry: 'Fintech',
  },
  Google: {
    company: 'Google',
    peers: ['Microsoft', 'Amazon', 'Meta', 'Adobe'],
    industry: 'Tech Giant',
  },
  Microsoft: {
    company: 'Microsoft',
    peers: ['Google', 'Amazon', 'Meta', 'Adobe'],
    industry: 'Tech Giant',
  },
  Amazon: {
    company: 'Amazon',
    peers: ['Google', 'Microsoft', 'Meta'],
    industry: 'Tech Giant',
  },
  NVIDIA: {
    company: 'NVIDIA',
    peers: ['AMD', 'Intel', 'Qualcomm', 'Arm'],
    industry: 'Semiconductors',
  },
  AMD: {
    company: 'AMD',
    peers: ['NVIDIA', 'Intel', 'Qualcomm'],
    industry: 'Semiconductors',
  },
  Flipkart: {
    company: 'Flipkart',
    peers: ['Amazon', 'Meesho', 'Zepto', 'Zomato'],
    industry: 'E-commerce',
  },
  Swiggy: {
    company: 'Swiggy',
    peers: ['Zomato', 'Zepto', 'Dunzo'],
    industry: 'Logistics/Delivery',
  },
  Zomato: {
    company: 'Zomato',
    peers: ['Swiggy', 'Zepto', 'Blinkit'],
    industry: 'Logistics/Delivery',
  },
};

export class CompanyGraph {
  static getPeers(companyName: string): string[] {
    const clean = companyName.toLowerCase().trim();
    for (const [key, node] of Object.entries(COMPANY_GRAPH)) {
      if (key.toLowerCase() === clean || node.company.toLowerCase() === clean) {
        return node.peers;
      }
    }
    return [];
  }
}
export default CompanyGraph;
