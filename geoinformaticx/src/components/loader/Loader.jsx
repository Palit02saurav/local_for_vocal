import styles from "./Loader.module.css";

export default function Loader({ fullScreen = true, label = "Loading" }) {
  return (
    <div className={fullScreen ? styles.fullScreenWrap : styles.inlineWrap}>
      <div className={styles.loaderBox}>
        <div className={styles.ring}></div>
        <div className={styles.dot}></div>
        {label ? <p className={styles.label}>{label}</p> : null}
      </div>
    </div>
  );
}