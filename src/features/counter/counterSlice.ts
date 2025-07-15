import {
  createAction,
  createAsyncThunk,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";
import { Timestamp } from "firebase/firestore";

export const fetchProduct = createAsyncThunk(
  "products/fetchProduct",
  async () => {
    try {
      const res = await fetch("http://localhost:3000/api/product/fetch");
      const result = await res.json();
      return result.data;
    } catch (error) {
      console.log(error);
    }
  }
);

export const detailProduct = createAsyncThunk(
  "products/detailProduct",
  async (id: string | null, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/detailProduct/", {
        method: "POST",
        body: JSON.stringify(id),
      });
      const result = await res.json();

      return result;
    } catch (error) {
      console.log(error);
      return rejectWithValue("Gagal fetch data");
    }
  }
);

export const purchaseOrder = createAsyncThunk(
  "delivery/purchase/",
  async (email: string | null) => {
    const res = await fetch("/api/purchase", {
      method: "POST",
      body: JSON.stringify(email),
    });

    const result = await res.json();
    return result;
  }
);

interface Delivery {
  address: string;
  email: string;
  created_at: Date;
  lat: number;
  lon: number;
  status: string;
  transaction_id: string;
}

export const fetchDeliveries = createAsyncThunk(
  "deliveries/fetchDeliveries",
  async (
    { email, transaction_id }: { email: string | null; transaction_id: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch("http://localhost:3000/api/delivery/", {
        method: "POST",
        headers: {
          "Content-Type": "application.json",
        },
        body: JSON.stringify({ email, transaction_id }),
      });
      const data = res.json();

      return data;
    } catch (error) {
      console.log(error);
      return rejectWithValue("Gagal fetch data");
    }
  }
);

interface QTY {
  user_id: string;
  operation: "Increment" | "Decrement";
  product_id: string;
}

interface DLT {
  user_id: string;
  product_id: string;
}

export const DeleteProductCart = createAsyncThunk(
  "products/deleteCart",
  async ({ user_id, product_id }: DLT) => {
    try {
      const res = await fetch("/api/deleteProductCart/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, product_id }),
      });

      const result = await res.json();
      const data = result.data;

      return data[0];
    } catch (error) {
      console.log(error);
    }
  }
);

export const UpdateQty = createAsyncThunk(
  "products/updateQty",
  async ({ user_id, operation, product_id }: QTY) => {
    try {
      const res = await fetch("/api/updateQty/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, operation, product_id }),
      });

      const result = await res.json();

      return {
        result,
      };
    } catch (error) {
      console.log(error);
    }
  }
);

export const cartDB = createAsyncThunk(
  "products/fetchCartDB",
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/fetchCarts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const dataProduct = await res.json();

      return dataProduct.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);
export interface Products {
  id: string;
  image: string;
  name: string;
  price: number;
  qty: number;
}

interface ProductCarts {
  id?: string;
  product_id: string;
  qty: number;
  user_id: string;
}

interface CartAPI {
  id: string;
  user_id: string;
  product_id: string;
  qty: number;
  created_at?: Date;
  updated_at?: Date;
}
export interface CartItem {
  name: string;
  image: string;
  price: number;
  user_id: string;
  product_id: string;
  qty: number;
}

// export const addToCartDB = createAsyncThunk(
export const addToCartDB = createAsyncThunk<CartAPI, ProductCarts>(
  "product/addToCartDB",
  async (item, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/cart/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([item]),
      });

      const data = await res.json();

      console.log(data.cartItem);
      return data.cartItem;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// 2. Untuk guest user: hanya update Redux
export const addToCartLocal = createAction<Omit<ProductCarts, "user_id">>(
  "cart/addToCartLocal"
);

interface Purchase {
  order_id: string;
  created_at: Timestamp;
  items: Array<{
    quantity: number;
    price: number;
    name: string;
    image: string;
  }>;
  // image: string;
  gross_amount: number;
  address: string;
  status: string;
}

export interface CounterState {
  cart: CartItem[];
  products: Products[];
  detailProduct: Products | null;
  modal: boolean;
  error: string;
  modalDetailTransaction: boolean;
  delivery: Delivery[];
  purchase: Array<Purchase> | null;
  isNear: boolean;
  confirm: boolean;
  isLoading: boolean;
  logout: boolean;
  hasFetchedPurchase: boolean;
}

const initialState: CounterState = {
  cart: [],
  products: [],
  detailProduct: null,
  modal: false,
  error: "",
  modalDetailTransaction: false,
  delivery: [],
  purchase: null,
  isNear: false,
  confirm: false,
  isLoading: false,
  logout: false,
  hasFetchedPurchase: false,
};

export const counterSlice = createSlice({
  name: "counter",
  initialState,
  reducers: {
    setConfirm: (state, action) => {
      state.confirm = action.payload;
    },
    setLogout: (state, action) => {
      state.logout = action.payload;
    },
    setIsNear: (state, action) => {
      state.isNear = action.payload;
    },
    updateCart: (state, action) => {
      state.cart = [...action.payload];
    },
    setProducts: (state, action: PayloadAction<Products[]>) => {
      state.products = action.payload;
    },
    incrementQty: (state, action) => {
      const item = state.cart.find(
        (el) =>
          el.user_id === action.payload.user_id &&
          el.product_id === action.payload.product_id
      );
      if (item) {
        item.qty++;
      } else {
        console.log("item kosong");
      }
    },
    decrementQty: (state, action) => {
      const item = state.cart.find(
        (el) =>
          el.user_id === action.payload.user_id &&
          el.product_id === action.payload.product_id
      );

      if (item) {
        const currentData = item.qty;
        if (currentData === 1) {
          item.qty = 1;
        } else {
          item.qty = currentData - 1;
        }
      }
    },
    addToCart: (state, action) => {
      const itemInCart = state.cart.find(
        (item) => item.product_id === action.payload.product_id
      );

      if (itemInCart) {
        itemInCart.qty += 1;
      } else {
        state.cart.push(action.payload);
      }
    },
    addToCartLocal: (state, action) => {
      const existing = state.cart.find(
        (item) => item.product_id === action.payload.product_id
      );

      if (existing) {
        existing.qty += action.payload.qty;
      } else {
        state.cart.push({
          ...action.payload,
          user_id: "", // Guest user
        });
      }
    },
    setModal: (state, action) => {
      state.modal = action.payload;
    },
    setModalDetailTransaction: (state, action) => {
      state.modalDetailTransaction = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(cartDB.fulfilled, (state, action) => {
      state.cart = action.payload;
    });
    builder.addCase(fetchProduct.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchProduct.fulfilled, (state, action) => {
      state.isLoading = false;
      state.products = action.payload;
    });

    builder.addCase(UpdateQty.fulfilled, (state, action) => {
      const product = state.cart.find(
        (item) =>
          item.user_id === action.payload?.result?.data?.user_id &&
          item.product_id === action.payload?.result?.data?.product_id
      );
      if (product) {
        product.qty = action.payload?.result.data.qty;
      } else {
        state.error = action.payload?.result.message;
      }
    });
    builder.addCase(DeleteProductCart.fulfilled, (state, action) => {
      state.cart = state.cart.filter(
        (data) =>
          !(
            data.user_id === action.payload?.user_id &&
            data.product_id === action.payload?.product_id
          )
      );
    });
    builder.addCase(fetchDeliveries.fulfilled, (state, action) => {
      state.delivery = action.payload.data;
    });
    builder.addCase(detailProduct.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(detailProduct.fulfilled, (state, action) => {
      state.isLoading = false;
      state.detailProduct = action.payload.data;
    });
    builder.addCase(purchaseOrder.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(purchaseOrder.fulfilled, (state, action) => {
      interface Pur {
        order_id: string;
        created_at: Timestamp;
        items: Array<{
          quantity: number;
          price: number;
          name: string;
          image: string;
        }>;
        gross_amount: number;
        address: string;
        status: string;
      }

      const resultDataTransaction: Pur[] = [];
      if (Array.isArray(action.payload.dataTransaction)) {
        for (let i = 0; i < action.payload.dataTransaction.length; i++) {
          const transaction = action.payload.dataTransaction[i];

          const loopItems = transaction.items.map(
            (items: {
              quantity: number;
              price: number;
              name: string;
              image: string;
            }) => {
              const getImage = action.payload.image?.find(
                (img: {
                  image: string;
                  name: string;
                  price: string;
                  qty: number;
                }) => img.name === items.name
              );
              return {
                ...items,
                image: getImage.image || "",
              };
            }
          );

          resultDataTransaction.push({
            order_id: transaction.order_id,
            created_at: transaction.created_at,
            items: loopItems,
            gross_amount: transaction.gross_amount,
            address: transaction.address,
            status: action.payload.dataDeliveries[i]?.status ?? "unknown",
          });
        }
      }
      state.isLoading = false;
      state.purchase = resultDataTransaction;
      state.hasFetchedPurchase = true;
    });
  },
});

// Action creators are generated for each case reducer function
export const {
  incrementQty,
  decrementQty,
  addToCart,
  setModal,
  setModalDetailTransaction,
  updateCart,
  setIsNear,
  setConfirm,
  setLogout,
} = counterSlice.actions;

export default counterSlice.reducer;
