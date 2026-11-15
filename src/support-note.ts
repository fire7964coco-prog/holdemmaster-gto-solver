/** 「무료 · 함께 만든다」 안내 문구 (사장님 11-15 — 한국어만 먼저 넣어 화면으로 확인).
 *  자리 3곳: 소개 «무료» 카드 · 계산이 끝난 뒤 공유 버튼 아래 · 후기 창 머리.
 *  후기·공유 서버가 있는 사이트의 트레이너 빌드에서만 보인다. 20언어(11-15 번역 · 아스트라 울트라 검수). */
import { i18n } from "./i18n";
import type { LocaleDict } from "./i18n";
import { MAIN_SITE_CONFIG } from "./main-site";

declare const __APP_TARGET__: "trainer" | "solo";

/** 출시 스위치 — 사장님이 캡처를 보고 자리·강조를 정한 뒤(번역·판정 뒤) 켠다.
 *  꺼져 있어도 localhost에서 localStorage `solver.supportNote.test`=1이면 보인다(캡처용). */
export const SUPPORT_NOTE_LAUNCHED = true;

const testOn = (): boolean => {
  try {
    return ["localhost", "127.0.0.1"].includes(location.hostname) &&
      localStorage.getItem("solver.supportNote.test") === "1";
  } catch {
    return false;
  }
};

const ON = __APP_TARGET__ === "trainer" && MAIN_SITE_CONFIG.feedbackApi !== "" &&
  (SUPPORT_NOTE_LAUNCHED || testOn());

type Note = { card: string; share: string; form: string };

/* card: 카드 제목·첫 줄이 이미 «무료»라 여기서는 무료를 다시 말하지 않는다 */
const NOTES: LocaleDict<Note> = {
  ko: {
    card: "도움이 되셨다면 공유 한 번, 후기 한 편이 저희에게 가장 큰 힘이 됩니다.",
    share: "무료 솔버입니다. 공유 한 번, 후기 한 편이 큰 힘이 됩니다.",
    form:
      "이 솔버는 이용자와 함께 만들어 갑니다. 원하는 기능이나 디자인을 알려 주세요. 많은 분께 좋은 방향이면 반영하고, 계속 업그레이드하겠습니다.",
  },
  en: {
    card: "If it helped, one share or one review is the biggest support you can give us.",
    share: "This solver is free. A share or a review helps a lot.",
    form:
      "We build this solver together with the people who use it. Tell us what features or design changes you'd like. If it's a good direction for many users, we'll add it, and we'll keep upgrading.",
  },
  ja: {
    card: "役に立ったら、1回の共有や1件のレビューが私たちにとって一番の力になります。",
    share: "無料のソルバーです。共有やレビューが大きな力になります。",
    form:
      "このソルバーは利用者のみなさんと一緒に作っていきます。ほしい機能やデザインを教えてください。多くの方にとって良い方向であれば反映し、これからもアップグレードを続けます。",
  },
  es: {
    card: "Si te sirvió, compartirlo una vez o dejar una opinión es la mayor ayuda para nosotros.",
    share: "Este solver es gratis. Compartirlo o dejar una opinión nos ayuda mucho.",
    form:
      "Desarrollamos este solver junto con quienes lo usan. Cuéntanos qué funciones o cambios de diseño te gustaría ver. Si una propuesta beneficia a muchas personas, la incorporaremos y seguiremos mejorando el solver.",
  },
  pt: {
    card: "Se ajudou, um compartilhamento ou uma avaliação é a maior força que você pode nos dar.",
    share: "Este solver é gratuito. Compartilhar ou avaliar ajuda muito.",
    form:
      "Desenvolvemos este solver junto com quem o usa. Conte quais recursos ou mudanças de design você gostaria de ver. Se a sugestão for boa para muita gente, vamos implementá-la e continuar melhorando o solver.",
  },
  de: {
    card: "Wenn er dir geholfen hat: Einmal teilen oder eine Bewertung ist die größte Unterstützung für uns.",
    share: "Dieser Solver ist kostenlos. Teilen oder bewerten hilft uns sehr.",
    form:
      "Diesen Solver entwickeln wir gemeinsam mit seinen Nutzern. Sag uns, welche Funktionen oder welches Design du dir wünschst. Wenn es für viele eine gute Richtung ist, setzen wir es um und entwickeln den Solver laufend weiter.",
  },
  zh: {
    card: "如果对你有帮助，一次分享、一条评价就是对我们最大的支持。",
    share: "这是免费的求解器。一次分享、一条评价都是很大的支持。",
    form:
      "我们正和用户一起打造这款求解器。想要什么功能或设计，请告诉我们。如果这个方向对很多用户有益，我们就会采纳，并持续升级。",
  },
  "zh-hant": {
    card: "如果對你有幫助，一次分享、一則評價就是對我們最大的支持。",
    share: "這是免費的求解器。一次分享、一則評價都是很大的支持。",
    form:
      "我們正和使用者一起打造這款求解器。想要什麼功能或設計，請告訴我們。如果這個方向對許多使用者有益，我們就會採納，並持續升級。",
  },
  fr: {
    card: "S'il t'a été utile, un partage ou un avis est le plus grand soutien que tu puisses nous apporter.",
    share: "Ce solver est gratuit. Un partage ou un avis nous aide beaucoup.",
    form:
      "Ce solver se construit avec celles et ceux qui l'utilisent. Dis-nous quelles fonctions ou quel design tu aimerais. Si c'est une bonne direction pour beaucoup de monde, nous l'ajouterons et nous continuerons à l'améliorer.",
  },
  id: {
    card: "Jika terbantu, satu kali berbagi atau satu ulasan adalah dukungan terbesar bagi kami.",
    share: "Solver ini gratis. Berbagi atau menulis ulasan sangat membantu kami.",
    form:
      "Solver ini kami kembangkan bersama para penggunanya. Beri tahu kami fitur atau desain yang Anda inginkan. Jika itu arah yang baik bagi banyak orang, kami akan menerapkannya dan terus meningkatkannya.",
  },
  ms: {
    card: "Jika ia membantu, satu perkongsian atau satu ulasan ialah sokongan terbesar buat kami.",
    share: "Solver ini percuma. Berkongsi atau menulis ulasan amat membantu kami.",
    form:
      "Solver ini kami bangunkan bersama penggunanya. Beritahu kami ciri atau reka bentuk yang anda mahu. Jika ia hala tuju yang baik untuk ramai orang, kami akan melaksanakannya dan terus menambah baik.",
  },
  hi: {
    card: "अगर यह काम आया हो, तो एक शेयर या एक समीक्षा हमारे लिए सबसे बड़ा सहारा है।",
    share: "यह सॉल्वर मुफ़्त है। एक शेयर या एक समीक्षा से हमें बहुत मदद मिलती है।",
    form:
      "यह सॉल्वर हम इसके उपयोगकर्ताओं के साथ मिलकर बनाते हैं। बताइए कि आपको कौन-से फ़ीचर या डिज़ाइन चाहिए। अगर वह बहुत-से लोगों के लिए अच्छी दिशा हो, तो हम उसे शामिल करेंगे और लगातार अपग्रेड करते रहेंगे।",
  },
  tr: {
    card: "İşine yaradıysa, bir paylaşım ya da bir yorum bizim için en büyük destek.",
    share: "Bu solver ücretsiz. Bir paylaşım ya da yorum bize çok destek olur.",
    form:
      "Bu solver'ı kullanıcılarıyla birlikte geliştiriyoruz. İstediğin özellikleri ya da tasarımı bize yaz. Birçok kişi için iyi bir yönse ekleriz ve geliştirmeye devam ederiz.",
  },
  vi: {
    card: "Nếu thấy hữu ích, một lượt chia sẻ hay một đánh giá là nguồn động viên lớn nhất với chúng tôi.",
    share: "Solver này miễn phí. Một lượt chia sẻ hay đánh giá giúp chúng tôi rất nhiều.",
    form:
      "Solver này được xây dựng cùng với người dùng. Hãy cho chúng tôi biết tính năng hoặc thiết kế bạn muốn. Nếu đó là hướng đi tốt cho nhiều người, chúng tôi sẽ đưa vào và tiếp tục nâng cấp.",
  },
  ru: {
    card: "Если солвер пригодился, поделись им или оставь отзыв — это лучшая поддержка для нас.",
    share: "Солвер бесплатный. Поделись или оставь отзыв — это очень помогает.",
    form:
      "Этот солвер мы развиваем вместе с пользователями. Расскажи, какие функции или изменения в дизайне ты хочешь видеть. Если эти предложения будут полезны многим пользователям, мы их реализуем и продолжим улучшать солвер.",
  },
  /* ar은 후기 창이 꺼져 있어(solver-feedback-features.ts) card·share에서 «후기»를 뺐다. 열리면 다시 넣을 것 */
  ar: {
    card: "إذا أفادك، فمشاركة واحدة منك هي أكبر دعم لنا.",
    share: "هذا السولفر مجاني. مشاركتك تدعمنا كثيرًا.",
    form:
      "نبني هذا السولفر مع مستخدميه. أخبرنا بالميزات أو التصميم الذي تريده. إذا كان اتجاهًا جيدًا لكثير من الناس فسنضيفه، وسنواصل التطوير.",
  },
  it: {
    card: "Se ti è stato utile, una condivisione o una recensione è il sostegno più grande per noi.",
    share: "Questo solver è gratuito. Una condivisione o una recensione ci aiuta molto.",
    form:
      "Questo solver lo costruiamo insieme a chi lo usa. Dicci quali funzioni o quale design vorresti. Se è una buona direzione per molti, lo aggiungeremo e continueremo a migliorarlo.",
  },
  pl: {
    card: "Jeśli solver ci pomógł, jedno udostępnienie albo jedna opinia to dla nas największe wsparcie.",
    share: "Ten solver jest darmowy. Udostępnienie albo opinia bardzo nam pomoże.",
    form:
      "Ten solver tworzymy razem z użytkownikami. Napisz, jakie funkcje lub zmiany w wyglądzie chcesz zobaczyć. Jeśli te propozycje będą korzystne dla wielu osób, wdrożymy je i będziemy dalej ulepszać solver.",
  },
  th: {
    card: "ถ้าใช้แล้วมีประโยชน์ แค่แชร์หรือเขียนรีวิวให้เราสักครั้งก็เป็นกำลังใจที่ยิ่งใหญ่ที่สุดสำหรับเรา",
    share: "Solver นี้ใช้ฟรี การแชร์หรือรีวิวช่วยเราได้มาก",
    form:
      "เราพัฒนา Solver นี้ร่วมกับผู้ใช้ บ⁠อ⁠กเราได้ว่าอยากได้ฟีเจอร์หรือดีไซน์แบบไหน ถ้าเป็นแนวทางที่ดีสำหรับผู้ใช้จำ⁠น⁠ว⁠นมาก เราจะนำไปปรับใช้และอัปเกรดต่อไปเรื่อย ๆ",
  },
  uk: {
    card: "Якщо солвер став у пригоді, поділися ним або залиш відгук — це найбільша підтримка для нас.",
    share: "Солвер безкоштовний. Поділися або залиш відгук — це дуже допомагає.",
    form:
      "Цей солвер ми створюємо разом із користувачами. Напиши, які функції чи зміни в дизайні ти хочеш бачити. Якщо ці пропозиції будуть корисними для багатьох користувачів, ми їх втілимо й продовжимо вдосконалювати солвер.",
  },
};

export type SupportNoteKey = keyof Note;

/** 템플릿·computed 안에서 부르면 언어 전환을 따라간다 (i18n.locale이 반응형) */
export const supportNote = (key: SupportNoteKey): string =>
  ON ? NOTES[i18n.locale][key] : "";
