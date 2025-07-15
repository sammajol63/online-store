import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import app from "./init";
const firestore = getFirestore(app);
import { serverTimestamp } from "firebase/firestore";

export async function fetchProduct(collectionName: string) {
  const q = query(collection(firestore, collectionName));
  const snapshot = await getDocs(q);

  const res = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return res;
}

interface LoginCallback {
  (result: {
    status: boolean;
    data: {
      email: string;
      fullname: string;
      role: string;
      type: string;
      image: string;
    };
  }): void;
}
export async function loginWithGoogle(
  data: {
    fullname: string;
    email: string;
    role: string;
    type: string;
    image: string;
  },
  callback: LoginCallback
) {
  const q = query(
    collection(firestore, "users"),
    where("email", "==", data.email)
  );

  const snapshot = await getDocs(q);

  interface User {
    id: string;
    email: string;
    fullname: string;
    role: string;
  }
  const user: User[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<User, "id">),
  }));

  if (user.length > 0) {
    data.role = user[0].role; // ini supaya role nya gk ter update kalau perubahan data di google
    // ini utk mengupdate data di google
    await updateDoc(doc(firestore, "users", user[0].id), data).then(() => {
      callback({ status: true, data: data });
    });
  } else {
    data.role = "member";
    await addDoc(collection(firestore, "users"), data).then(() => {
      callback({ status: true, data: data });
    });
  }
}
interface CartFirestoreData {
  id: string;
  user_id: string;
  product_id: string;
  qty: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Products {
  product_id: string;
  image: string;
  name: string;
  price: number;
  qty: number;
}

export async function pendingTransaction(data: {
  user: {
    fullname: string;
    email: string;
    address: string;
    lat: number;
    lon: number;
  };
  items: Array<Products>;
  order_id: string;
}) {
  await setDoc(doc(firestore, "pending_transactions", data.order_id), {
    status: "pending",
    user: {
      fullname: data.user.fullname,
      email: data.user.email,
      address: data.user.address,
      lat: Number(data.user.lat),
      lon: Number(data.user.lon),
    },
    items: data.items,
    created_at: Timestamp.now(),
  });

  return { message: "Success set data", status: 200 };
}

export async function transaction(data: {
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_status: string;
  transaction_time: Timestamp;
  fraud_status: string;
}) {
  try {
    const docRef = doc(firestore, "transactions", data.order_id);
    const existing = await getDoc(docRef);

    if (existing.exists()) {
      return {
        status: true,
        message: "Transaksi sudah pernah diproses",
        statusCode: 200,
      };
    }

    if (
      data.transaction_status === "settlement" ||
      (data.transaction_status === "capture" && data.fraud_status === "accept")
    ) {
      const temp = doc(firestore, "pending_transactions", data.order_id);
      const snap = await getDoc(temp);
      if (!snap.exists()) {
        return { message: "Order not found", status: 404 };
      }
      const tempData = snap.data();

      await setDoc(docRef, {
        order_id: data.order_id,
        transaction_id: data.transaction_id,
        transaction_time: data.transaction_time,
        user_id: tempData.user.email,
        name: tempData.user.fullname,
        address: tempData.user.address,
        payment_type: data.payment_type,
        items: tempData.items,
        gross_amount: data.gross_amount,
        fraud_status: data.fraud_status,
        transaction_status: data.transaction_status,
        created_at: new Date(),
      });

      for (const item of tempData.items) {
        await updateDoc(doc(firestore, "products", item.id), {
          qty: increment(-item.quantity),
        });

        const q = query(
          collection(firestore, "carts"),
          where("user_id", "==", tempData.user.email),
          where("product_id", "==", item.id)
        );

        const snap = await getDocs(q);
        snap.docs.map(async (doc) => {
          await deleteDoc(doc.ref);
        });
      }
    }

    return {
      status: true,
      statusCode: 200,
      message: "Transaction success",
    };
  } catch (error) {
    console.log(error);
    return {
      status: false,
      statusCode: 500,
      message: "Transaction failed",
    };
  }
}

interface Purchase {
  order_id: string;
  created_at: Timestamp;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    name: string;
    image: string;
  }>;
  gross_amount: number;
  address: string;
  status: string;
}

export async function purchase(email: string) {
  try {
    const q = query(
      collection(firestore, "transactions"),
      where("user_id", "==", email)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return {
        status: false,
        message: " Transaction not found",
        statusCode: 404,
      };
    }
    const resultTransaction: (Purchase & { id: string })[] = snapshot.docs.map(
      (doc) => ({
        id: doc.id,
        ...doc.data(),
      })
    ) as (Purchase & { id: string })[];

    const productImg = [];

    for (const transc of resultTransaction) {
      for (const items of transc.items) {
        const docRef = doc(firestore, "products", items.id);
        const tempImageSnap = await getDoc(docRef);
        productImg.push(tempImageSnap.data());
      }
    }

    const qDelivery = query(
      collection(firestore, "deliveries"),
      where("email", "==", email)
    );
    const snapshotDlv = await getDocs(qDelivery);
    if (snapshotDlv.empty) {
      return {
        status: false,
        message: " Delivery not found",
        statusCode: 404,
      };
    }

    const resultDelivery = snapshotDlv.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      status: true,
      dataTransaction: resultTransaction,
      dataDeliveries: resultDelivery,
      image: productImg,
      statusCode: 200,
    };
  } catch (error) {
    console.log(error);
    return { status: false, message: "Invalid Server Error", statusCode: 500 };
  }
}

export async function delivery(data: { order_id: string }) {
  try {
    const docRef = doc(firestore, "deliveries", data.order_id);
    const delivery = await getDoc(docRef);

    if (delivery.exists()) {
      return { message: "Delivery sudah pernah di proses", status: 404 };
    }

    const temp = doc(firestore, "pending_transactions", data.order_id);
    const snapshot = await getDoc(temp);
    if (!snapshot.exists) {
      return { message: "Order not found", status: 404 };
    }

    const tempResult = snapshot.data();

    await setDoc(docRef, {
      transaction_id: data.order_id,
      address: tempResult?.user.address,
      email: tempResult?.user.email,
      lat: tempResult?.user.lat,
      lon: tempResult?.user.lon,
      status: "Dalam pengiriman",
      created_at: serverTimestamp(),
    });

    return {
      message: "Berhasil beli product dan dalam pengiriman",
      status: 200,
    };
  } catch (error) {
    console.log(error);
  }
}

export async function cartSync(
  data: {
    product_id: string;
    qty: number;
    user_id: string;
  }[]
) {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      return {
        status: false,
        message: "Invalid data format",
        statusCode: 400,
      };
    }
    const q = query(
      collection(firestore, "carts"),
      where("user_id", "==", data[0].user_id)
    );
    const snapshot = await getDocs(q);
    const dataUser: CartFirestoreData[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<CartFirestoreData, "id">),
    }));

    const results = [];
    if (dataUser.length > 0) {
      for (const item of data) {
        const productInCart = dataUser.find(
          (entry) => entry.product_id === item.product_id
        );

        if (productInCart?.product_id) {
          const productRef = doc(firestore, "carts", productInCart.id);
          const currentQty =
            typeof productInCart.qty === "number" ? productInCart.qty : 0;

          await updateDoc(productRef, {
            qty: currentQty + item.qty,
          });
          results.push(`${item.product_id}`);
        } else {
          await addDoc(collection(firestore, "carts"), {
            created_at: serverTimestamp(),
            product_id: item.product_id,
            qty: item.qty,
            updated_at: serverTimestamp(),
            user_id: item.user_id,
          });
          results.push(`${item.product_id}`);
        }
      }

      return {
        status: true,
        statusCode: 200,
        message: "Success Add Product To Cart",
        results,
      };
    } else {
      for (const item of data) {
        await addDoc(collection(firestore, "carts"), {
          created_at: serverTimestamp(),
          product_id: item.product_id,
          qty: item.qty,
          user_id: item.user_id,
          updated_at: serverTimestamp(),
        });
        results.push(`New user cart added: ${item.product_id}`);
      }
    }
  } catch (error) {
    console.error(" cartSync error:", error);

    return {
      status: false,
      message: "Internal Server Error",
      statusCode: 500,
    };
  }
}

export async function fetchCart(collactionName: string, email: string) {
  const q = query(
    collection(firestore, collactionName),
    where("user_id", "==", email)
  );
  const snapshot = await getDocs(q);
  const resultCarts = snapshot.docs.map((doc) => doc.data().product_id);

  const productsRefs = resultCarts.map((id) => doc(firestore, "products", id));
  const productSnaps = await Promise.all(productsRefs.map(getDoc));

  const result = snapshot.docs.map((cartDoc, index) => ({
    name: productSnaps[index].data()?.name,
    image: productSnaps[index].data()?.image,
    price: productSnaps[index].data()?.price,
    ...cartDoc.data(),
  }));

  return {
    status: true,
    statusCode: 200,
    message: "Success Get Carts",
    result,
  };
}

export async function detailProduct(id: string) {
  try {
    const docRef = doc(firestore, "products", id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return { message: "failed get data", status: 404 };

    return {
      data: { id: snapshot.id, ...snapshot.data() },
      message: "Succces get data",
      status: 200,
    };
  } catch (error) {
    return { error: error, message: "failed get data", status: 404 };
  }
}

export async function updateQty(data: {
  user_id: string;
  operation: "Increment" | "Decrement";
  product_id: string;
}) {
  const q = query(
    collection(firestore, "carts"),
    where("user_id", "==", data.user_id),
    where("product_id", "==", data.product_id)
  );

  const snapshot = await getDocs(q);
  const result: CartFirestoreData[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<CartFirestoreData, "id">),
  }));

  const product = result[0];
  let newQty = product.qty;
  try {
    const productRef = doc(firestore, "products", data.product_id);
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) {
      throw new Error("Product not found");
    }
    const productData = productSnap.data();
    const availableStock = productData.qty;

    if (product) {
      const productRef = doc(firestore, "carts", product.id);
      if (data.operation === "Increment") {
        if (newQty + 1 > availableStock) {
          return {
            status: false,
            statusCode: 400,
            message: "Qty melebihi stok produk yang tersedia",
          };
        }
        newQty += 1;
      } else if (data.operation === "Decrement") {
        newQty = Math.max(1, newQty - 1);
      }

      await updateDoc(productRef, {
        qty: newQty,
        updated_at: new Date(),
      });
    }

    return {
      status: true,
      data: { ...product, qty: newQty },
      statusCode: 200,
      message: "Success update Quantity",
    };
  } catch (error) {
    return {
      status: false,
      data: null,
      statusCode: 404,
      message: "Product not found in cart",
      error,
    };
  }
}

export async function deleteCartProduct(data: {
  user_id: string;
  product_id: string;
}) {
  const q = query(
    collection(firestore, "carts"),
    where("user_id", "==", data.user_id),
    where("product_id", "==", data.product_id)
  );

  const snap = await getDocs(q);
  if (snap.empty) {
    return {
      status: false,
      statusCode: 404,
      message: "Product not found in cart",
    };
  }

  const result = await Promise.all(
    snap.docs.map(async (doc) => {
      await deleteDoc(doc.ref);
      return { ...doc.data() };
    })
  );

  return {
    status: true,
    statusCode: 200,
    data: result,
    message: "Product successfully removed from cart",
  };
}

export function filterAvailableCart(
  cart: {
    user_id: string;
    product_id: string;
    qty: number;
  }[],
  products: {
    id: string;
    image: string;
    name: string;
    price: number;
    qty: number;
  }[]
) {
  const available = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      if (product && product.qty > 0) {
        return {
          ...item,
          name: product.name,
          image: product.image,
          price: product.price,
        };
      }
      return null;
    })
    .filter((item) => item !== null);

  return available as {
    name: string;
    image: string;
    price: number;
    user_id: string;
    product_id: string;
    qty: number;
  }[];
}

export function filterNotAvailableCart(
  cart: {
    user_id: string;
    product_id: string;
    qty: number;
  }[],
  products: {
    id: string;
    image: string;
    name: string;
    price: number;
    qty: number;
  }[]
) {
  const notAvailable = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      if (!product || product.qty <= 0) {
        return {
          ...item,
          name: product?.name ?? "Produk tidak ditemukan",
          image: product?.image ?? "",
          price: product?.price ?? 0,
        };
      }
      return null;
    })
    .filter((item) => item !== null);

  return notAvailable as {
    name: string;
    image: string;
    price: number;
    user_id: string;
    product_id: string;
    qty: number;
  }[];
}

export async function fetchDeliveries(data: {
  email: string;
  transaction_id: string;
}) {
  try {
    const q = query(
      collection(firestore, "deliveries"),
      where("email", "==", data.email),
      where("transaction_id", "==", data.transaction_id)
    );
    const snapshot = await getDocs(q);

    const result = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return result;
  } catch (error) {
    console.log(error);
  }
}

export async function updateStatusDelivery(transaction_id: string) {
  if (!transaction_id) return { message: "Tidak ada transaction" };

  try {
    const result = doc(firestore, "deliveries", transaction_id);
    await updateDoc(result, { status: "Diterima" });

    return {
      status: true,
      statusCode: 200,
      message: "Barhasil update status pemesanan",
    };
  } catch (error) {
    return {
      status: false,
      error,
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
}

export async function updateCourierPosition(
  transaction_id: string,
  lat: number,
  lon: number
) {
  console.log(lat, lon, transaction_id);

  const docRef = doc(firestore, "couriers", transaction_id);
  const snapshot = await getDoc(docRef);

  const data = {
    lat: lat,
    lon: lon,
    updated_at: new Date(),
  };

  if (!snapshot.exists()) {
    await setDoc(docRef, data);
  } else {
    await updateDoc(docRef, data);
  }
}
