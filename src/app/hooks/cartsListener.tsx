import {
  collection,
  query,
  where,
  onSnapshot,
  getFirestore,
} from "firebase/firestore";
import { updateCart } from "@/features/counter/counterSlice";
import app from "@/lib/firebase/init";
import { AppDispatch } from "@/store/index";
const firestore = getFirestore(app);

export default function cartsListener(user_id: string, dispatch: AppDispatch) {
  const q = query(
    collection(firestore, "carts"),
    where("user_id", "==", user_id)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const cartData = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate().toISOString() ?? null,
        updated_at: data.updated_at?.toDate().toISOString() ?? null,
      };
    });

    if (cartData.length > 0) {
      dispatch(updateCart(cartData));
    } else {
      console.warn("⚠️ [cartsListener] Cart kosong, tidak update Redux");
    }
  });

  return unsubscribe;
}
