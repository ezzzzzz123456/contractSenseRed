export const paymentService = {
  async createReviewCheckout(amount: number): Promise<{ checkoutUrl: string }> {
    return {
      checkoutUrl: `https://payments.example.com/checkout?amount=${amount}`,
    };
  },
};

