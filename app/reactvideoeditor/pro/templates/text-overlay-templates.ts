/**
 * Text overlay template configuration interface
 */
export interface TextOverlayTemplate {
  id: string;
  name: string;
  content: string;
  preview: string;
  category: string;
  styles: {
    fontSize: string;
    fontWeight: string;
    color: string;
    backgroundColor: string;
    fontFamily: string;
    fontStyle: string;
    textDecoration: string;
    lineHeight?: string;
    letterSpacing?: string;
    textAlign?: "left" | "center" | "right";
    textShadow?: string;
    padding?: string;
    paddingBackgroundColor?: string;
    borderRadius?: string;
    boxShadow?: string;
    background?: string;
    WebkitBackgroundClip?: string;
    WebkitTextFillColor?: string;
    backdropFilter?: string;
    border?: string;
    fontSizeScale?: number;
  };
}


export const textOverlayTemplates: Record<string, any> = {
  modern: {
    name: "モダンタイトル",
    content: "モダンタイトル",
    preview: "洗練されたミニマル",
    styles: {
      fontSize: "2.8rem",
      fontWeight: "700",
      color: "#FFFFFF",
      backgroundColor: "",
      fontFamily: "Inter",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1.1",
      textAlign: "center",
      letterSpacing: "-0.03em",
    },
  },
  impact: {
    name: "インパクト見出し",
    content: "強い印象を残す",
    preview: "大胆で力強い",
    styles: {
      fontSize: "3.5rem",
      fontWeight: "900",
      color: "#FFFFFF",
      backgroundColor: "",
      fontFamily: "Inter",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1",
      textAlign: "center",
      letterSpacing: "0.02em",
      textTransform: "uppercase",
      textShadow: "2px 2px 0px rgba(0, 0, 0, 0.2)",
    },
  },
  slicedText: {
    name: "スライステキスト",
    content: "スライス",
    preview: "エッジの効いたモダン",
    isPro: true,
    styles: {
      fontSize: "4.2rem",
      fontWeight: "900",
      color: "#FFFFFF",
      backgroundColor: "",
      fontFamily: "Inter",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1",
      textAlign: "center",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      textShadow: "6px 6px 0px #FF2D55, -6px -6px 0px #5E5CE6",
    },
  },
  minimalMonochrome: {
    name: "ミニマルモノクローム",
    content: "少ないほど豊か",
    preview: "ウルトラミニマル",
    styles: {
      fontSize: "3rem",
      fontWeight: "200",
      color: "#FFFFFF",
      backgroundColor: "",
      fontFamily: "Inter",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1",
      textAlign: "center",
      letterSpacing: "0.25em",
      textTransform: "lowercase",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      padding: "24px 48px",
    },
  },
  highlight: {
    name: "ハイライトボックス",
    content: "注目テキスト",
    preview: "モダンで印象的",
    styles: {
      fontSize: "2.4rem",
      fontWeight: "700",
      color: "#FFFFFF",
      backgroundColor: "rgba(79, 70, 229, 0.85)",
      fontFamily: "Inter",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1.2",
      padding: "16px 32px",
      borderRadius: "12px",
      textAlign: "center",
      boxShadow:
        "0 8px 16px -4px rgba(79, 70, 229, 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    },
  },
  gradient: {
    name: "グラデーションポップ",
    content: "グラデーション",
    preview: "ダイナミックでモダン",
    isPro: true,
    styles: {
      fontSize: "3.2rem",
      fontWeight: "800",
      background:
        "linear-gradient(135deg, #6366F1 0%, #EC4899 50%, #F59E0B 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      fontFamily: "Inter",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1.1",
      textAlign: "center",
      textShadow: "0px 0px 20px rgba(236, 72, 153, 0.3)",
    },
  },

  // New fashion-forward templates
  neonFuture: {
    name: "ネオンフューチャー",
    content: "ネオンフューチャー",
    preview: "鮮烈で大胆",
    styles: {
      fontSize: "3.2rem",
      fontWeight: "800",
      color: "#FFFFFF",
      fontFamily: "Inter",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1",
      textAlign: "center",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      textShadow: "0 0 10px #00FFFF, 0 0 20px #00FFFF, 0 0 30px #00FFFF",
      padding: "12px",
      border: "2px solid #00FFFF",
      borderRadius: "4px",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
  },

  avantGarde: {
    name: "アバンギャルド",
    content: "アバンギャルド",
    preview: "先鋭的なスタイル",
    isPro: true,
    styles: {
      fontSize: "3.6rem",
      fontWeight: "900",
      background: "linear-gradient(90deg, #FFFFFF 50%, #000000 50%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      fontFamily: "Inter",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1",
      textAlign: "center",
      letterSpacing: "0.15em",
      textTransform: "uppercase",
      padding: "8px",
      textShadow: "4px 4px 0px rgba(0, 0, 0, 0.1)",
    },
  },

  glassmorphic: {
    name: "グラスモーフィック",
    content: "ガラスエフェクト",
    preview: "透明感のあるモダン",
    styles: {
      fontSize: "3rem",
      fontWeight: "700",
      color: "#FFFFFF",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      fontFamily: "Inter",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1.2",
      textAlign: "center",
      letterSpacing: "0.1em",
      padding: "24px 48px",
      borderRadius: "16px",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
    },
  },
};
