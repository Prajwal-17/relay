const DATABASE_NAME = "quickcart-billing-reference-images";
const DATABASE_VERSION = 1;
const IMAGE_STORE_NAME = "image-blobs";

type ReferenceImageBlobRecord = {
  id: string;
  blob: Blob;
};

let databasePromise: Promise<IDBDatabase> | null = null;

const openDatabase = (): Promise<IDBDatabase> => {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("Image storage is not available on this device."));
      return;
    }

    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        database.createObjectStore(IMAGE_STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => {
        database.close();
        databasePromise = null;
      };
      resolve(database);
    };

    request.onerror = () => {
      databasePromise = null;
      reject(request.error ?? new Error("Image storage could not be opened."));
    };

    request.onblocked = () => {
      databasePromise = null;
      reject(new Error("Image storage is blocked by another QuickCart window."));
    };
  });

  return databasePromise;
};

const completeTransaction = (transaction: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("The image storage operation failed."));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("The image storage operation was cancelled."));
  });

export const saveReferenceImageBlob = async (id: string, blob: Blob): Promise<void> => {
  const database = await openDatabase();
  const transaction = database.transaction(IMAGE_STORE_NAME, "readwrite");
  const transactionComplete = completeTransaction(transaction);
  transaction.objectStore(IMAGE_STORE_NAME).put({ id, blob } satisfies ReferenceImageBlobRecord);
  await transactionComplete;
};

export const loadReferenceImageBlob = async (id: string): Promise<Blob | null> => {
  const database = await openDatabase();
  const transaction = database.transaction(IMAGE_STORE_NAME, "readonly");
  const transactionComplete = completeTransaction(transaction);
  const request = transaction.objectStore(IMAGE_STORE_NAME).get(id);

  const recordPromise = new Promise<ReferenceImageBlobRecord | undefined>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as ReferenceImageBlobRecord | undefined);
    request.onerror = () =>
      reject(request.error ?? new Error("The stored image could not be loaded."));
  });

  const [record] = await Promise.all([recordPromise, transactionComplete]);
  return record?.blob ?? null;
};

export const deleteReferenceImageBlob = async (id: string): Promise<void> => {
  const database = await openDatabase();
  const transaction = database.transaction(IMAGE_STORE_NAME, "readwrite");
  const transactionComplete = completeTransaction(transaction);
  transaction.objectStore(IMAGE_STORE_NAME).delete(id);
  await transactionComplete;
};
