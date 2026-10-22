import { initialData } from "./demo-data";
import { DemoState } from "./models";
import { browserRepository } from "./repository";

const serverSnapshot = { data: initialData, ready: false, storageError: "" };
let snapshot = serverSnapshot;
let initialised = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
export const demoStore = {
  getSnapshot: () => snapshot,
  getServerSnapshot: () => serverSnapshot,
  subscribe(listener: () => void) {
    listeners.add(listener);
    if (!initialised) {
      initialised = true;
      try {
        snapshot = {
          data: browserRepository.load() ?? structuredClone(initialData),
          ready: true,
          storageError: "",
        };
      } catch {
        snapshot = {
          data: structuredClone(initialData),
          ready: true,
          storageError:
            "Saved demo data could not be loaded. Reset demo data in Settings to recover.",
        };
      }
      notify();
    }
    return () => {
      listeners.delete(listener);
    };
  },
  update(transform: (data: DemoState) => DemoState) {
    const data = transform(snapshot.data);
    let storageError = "";
    try {
      browserRepository.save(data);
    } catch {
      storageError =
        "Browser storage is unavailable or full. Changes are only held in memory. Remove photos or export your report before leaving.";
    }
    snapshot = { data, ready: true, storageError };
    notify();
  },
};
