// declare module "midtrans-client" {
//   const midtransClient: any;
//   export = midtransClient;
// }

declare module "midtrans-client" {
  export interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  export interface CreditCardOptions {
    secure: boolean;
  }

  export interface CustomerDetails {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  }

  export interface CreateTransactionParams {
    transaction_details: TransactionDetails;
    credit_card?: CreditCardOptions;
    customer_details?: CustomerDetails;
    item_details?: Array<{
      id: string;
      price: number;
      quantity: number;
      name: string;
    }>;
    [key: string]: unknown; // optional fleksibilitas
  }

  export interface CreateTransactionResponse {
    token: string;
    redirect_url: string;
  }

  export class Snap {
    constructor(config: { isProduction: boolean; serverKey: string });

    createTransaction(
      params: CreateTransactionParams
    ): Promise<CreateTransactionResponse>;
  }

  export class CoreApi {
    constructor(config: {
      isProduction: boolean;
      serverKey: string;
      clientKey?: string;
    });

    charge(params: Record<string, unknown>): Promise<unknown>;
    capture(params: { transaction_id: string }): Promise<unknown>;
    refund(params: {
      transaction_id: string;
      amount: number;
    }): Promise<unknown>;
  }
}
