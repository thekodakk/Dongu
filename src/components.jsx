import { useEffect, useRef } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  X,
  Plus,
  Clock,
  Box,
  Check,
  Home,
  Route,
  CalendarDays,
  ChartNoAxesColumn,
  Settings,
  Search,
  Leaf,
  Utensils,
  Recycle,
  ChevronRight,
  Menu,
  SlidersHorizontal,
} from "lucide-react";
export const icons = {
  overview: Home,
  inventory: Box,
  routes: Route,
  plan: CalendarDays,
  insights: ChartNoAxesColumn,
  settings: Settings,
  task: Clock,
  food: Utensils,
  item: Box,
  route: Route,
  meal: Utensils,
  care: Recycle,
};
export {
  ArrowUpRight,
  ArrowRight,
  X,
  Plus,
  Clock,
  Box,
  Check,
  Search,
  Leaf,
  ChevronRight,
  Menu,
  SlidersHorizontal,
  CalendarDays,
};
export function Button({ children, variant = "", className = "", ...props }) {
  return (
    <button className={`button ${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function Empty({
  title = "Burada yeni bir başlangıç var.",
  children,
  action,
}) {
  return (
    <div className="empty">
      <Leaf size={38} strokeWidth={1.3} />
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function PageHeading({ title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        <h1>
          {title}
          <span>.</span>
        </h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef();
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const el = ref.current;
    const focusables = () =>
      [...el.querySelectorAll("button,input,select,textarea,a[href]")].filter(
        (x) => !x.disabled,
      );
    focusables()[0]?.focus();
    const fn = (e) => {
      if (e.key === "Escape") close.current();
      if (e.key === "Tab") {
        const nodes = focusables(),
          first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", fn);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`modal ${wide ? "wide" : ""}`}
      >
        <div className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-button" aria-label="Kapat" onClick={onClose}>
            <X />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function SuggestionDetail({ suggestion, onClose, onComplete, onPlan }) {
  const Icon = icons[suggestion.type];
  return (
    <Modal title={suggestion.title} onClose={onClose}>
      <div className="detail-intro">
        <div className="round-icon">
          <Icon />
        </div>
        <p>{suggestion.description}</p>
      </div>
      <div className="reason">
        <span>Neden bu bağlantı?</span>
        <p>{suggestion.reason}</p>
      </div>
      <div className="detail-numbers">
        <div>
          <strong>{suggestion.minutes} dk</strong>
          <span>Toplam süre</span>
        </div>
        <div>
          <strong>{suggestion.savedMinutes} dk</strong>
          <span>Tahmini kazanım</span>
        </div>
      </div>
      <ol className="steps">
        {suggestion.steps.map((step, i) => (
          <li key={i}>
            <span>{i + 1}</span>
            <div>{step.title}</div>
            <small>{step.minutes} dk</small>
          </li>
        ))}
      </ol>
      <p className="fine-print">
        Tamamladığında bu bağlantıdaki kayıtlar tamamlandı olarak işaretlenir.
        Süreler girdiğin değerlere ve sabit yol varsayımına dayanır.
      </p>
      <div className="modal-actions">
        <Button variant="secondary" onClick={() => onPlan(suggestion)}>
          <CalendarDays size={17} />
          Plana ekle
        </Button>
        <Button onClick={() => onComplete(suggestion)}>
          <Check size={17} />
          Tamamladım
        </Button>
      </div>
    </Modal>
  );
}
