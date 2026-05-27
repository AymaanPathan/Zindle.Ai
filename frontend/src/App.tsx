import { Provider } from "react-redux";
import { store } from "./store";
import Shell from "./components/Shell";

export default function App() {
  return (
    <Provider store={store}>
      <Shell />
    </Provider>
  );
}