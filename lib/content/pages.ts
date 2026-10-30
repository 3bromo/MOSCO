import type { Locale } from "@/lib/i18n/config";

export interface Block {
  heading: string;
  body: string[];
}

type Bilingual<T> = Record<Locale, T>;

export function pick<T>(src: Bilingual<T>, locale: Locale): T {
  return src[locale] ?? src.en;
}

/* -------------------------------------------------------------------- *
 * FAQ
 * -------------------------------------------------------------------- */
export const FAQ: Bilingual<{ q: string; a: string }[]> = {
  en: [
    {
      q: "How do I know which size to order?",
      a: "Every MOSCOW product page carries its own measurement chart — we do not publish one universal chart, because each cut is graded differently. You can also use MOSCOW Fit AI: three short questions about your height and weight, your body shape and the fit you like, and it compares your answers against that specific garment's measurements. It recommends a size and tells you how confident it is, but it never adds anything to your cart — the choice stays yours.",
    },
    {
      q: "Are the measurements on the size chart body or garment measurements?",
      a: "Garment measurements, taken flat, in centimetres. A 'chest 59 cm' row means the garment measures 59 cm across the chest when laid flat — roughly 118 cm around. Use the cm/inch toggle on the chart to switch units.",
    },
    {
      q: "What payment methods do you accept?",
      a: "Cash on Delivery anywhere we ship in Egypt, and InstaPay. If you pay with InstaPay you will see our handle and the exact amount at checkout, and you upload a screenshot of the transfer before placing the order. We confirm the transfer before the order moves to processing.",
    },
    {
      q: "How long does delivery take?",
      a: "Greater Cairo and Giza typically arrive in 1–3 working days. Alexandria and the Delta take 2–4 working days. Upper Egypt, Sinai, the Red Sea and the New Valley take 3–6 working days. You will get your order number the moment you check out, and you can follow the order on the tracking page at any time.",
    },
    {
      q: "Can I change my size after ordering?",
      a: "Yes, as long as the order has not shipped. Message us on WhatsApp with your order number and the size you want instead, and we will swap it if the new size is in stock.",
    },
    {
      q: "Do you restock sold-out sizes?",
      a: "Our drops are produced in limited runs. Some pieces are restocked, many are not. Sold-out sizes are shown struck through on the product page rather than hidden, so you can see exactly what existed in the drop.",
    },
    {
      q: "How should I wash MOSCOW denim?",
      a: "Wash inside out, cold, on a gentle cycle, with similar colours. Hang to dry away from direct heat. Do not tumble dry and do not bleach. Raw and rigid denim will fade with wear — that is intended, and it is what makes the piece yours.",
    },
    {
      q: "Do you ship outside Egypt?",
      a: "Not yet. International shipping is planned. Join the newsletter and you will hear about it first.",
    },
  ],
  ar: [
    {
      q: "كيف أعرف المقاس المناسب لي؟",
      a: "كل منتج في موسكو له جدول مقاسات خاص به — لا يوجد جدول موحّد، لأن كل قصّة مختلفة في التدريج. يمكنك أيضاً استخدام MOSCOW Fit AI: ثلاثة أسئلة قصيرة عن طولك ووزنك، شكل جسمك، والقَصّة التي تفضّلها، ثم نقارن إجاباتك بمقاسات هذه القطعة تحديداً. يقترح النظام مقاساً ويخبرك بمدى ثقته فيه، لكنه لا يضيف أي شيء إلى السلة — القرار يبقى لك.",
    },
    {
      q: "هل الأرقام في جدول المقاسات لقياسات الجسم أم القطعة؟",
      a: "قياسات القطعة نفسها، مفرودة، بالسنتيمتر. «صدر ٥٩ سم» تعني أن القطعة تقيس ٥٩ سم عرضاً عند الصدر وهي مفرودة — أي حوالي ١١٨ سم محيطاً. استخدم مفتاح سم/بوصة في الجدول لتغيير الوحدة.",
    },
    {
      q: "ما طرق الدفع المتاحة؟",
      a: "الدفع عند الاستلام في كل المحافظات التي نشحن إليها، و إنستا باي. عند اختيار إنستا باي ستظهر لك بيانات التحويل والمبلغ المطلوب بالضبط، وترفع صورة إيصال التحويل قبل تأكيد الطلب. نتحقق من التحويل قبل أن ينتقل الطلب إلى مرحلة التجهيز.",
    },
    {
      q: "كم يستغرق التوصيل؟",
      a: "القاهرة الكبرى والجيزة عادةً من ١ إلى ٣ أيام عمل. الإسكندرية والدلتا من ٢ إلى ٤ أيام عمل. الصعيد وسيناء والبحر الأحمر والوادي الجديد من ٣ إلى ٦ أيام عمل. ستحصل على رقم طلبك فور إتمام الشراء، ويمكنك متابعته من صفحة تتبّع الطلب في أي وقت.",
    },
    {
      q: "هل يمكنني تغيير المقاس بعد الطلب؟",
      a: "نعم، طالما لم يُشحن الطلب بعد. راسلنا على واتساب برقم الطلب والمقاس البديل، وسنغيّره إذا كان المقاس الجديد متوفراً.",
    },
    {
      q: "هل تعيدون توفير المقاسات التي نفدت؟",
      a: "إصداراتنا تُنتج بكميات محدودة. بعض القطع تعود وكثير منها لا يعود. المقاسات التي نفدت تظهر مشطوبة في صفحة المنتج بدل إخفائها، حتى ترى بالضبط ما الذي كان في الإصدار.",
    },
    {
      q: "كيف أغسل دنيم موسكو؟",
      a: "اغسلها مقلوبة، بماء بارد، على دورة لطيفة، مع ألوان مشابهة. علّقها لتجف بعيداً عن الحرارة المباشرة. تجنّب المجفّف والمبيّض. الدنيم الخام يبهت مع الاستخدام — وهذا مقصود، وهو ما يجعل القطعة ملكك أنت.",
    },
    {
      q: "هل تشحنون خارج مصر؟",
      a: "ليس بعد. الشحن الدولي ضمن خططنا القادمة. اشترك في النشرة البريدية لتكون أول من يعرف.",
    },
  ],
};

/* -------------------------------------------------------------------- *
 * Shipping
 * -------------------------------------------------------------------- */
export const SHIPPING: Bilingual<Block[]> = {
  en: [
    {
      heading: "Dispatch",
      body: [
        "Orders placed before 4:00 PM Cairo time on a working day are picked and packed the same day. Orders placed after that, or on Friday, are dispatched the next working day.",
        "Every order is checked by hand before it is sealed. If a piece does not pass inspection we hold the order and contact you rather than ship something we are not happy with.",
      ],
    },
    {
      heading: "Delivery times",
      body: [
        "Greater Cairo and Giza: 1–3 working days.",
        "Alexandria, the Delta and Canal cities: 2–4 working days.",
        "Upper Egypt, Sinai, the Red Sea and the New Valley: 3–6 working days.",
        "Delivery windows are estimates from our courier partners, not guarantees. Public holidays and extreme weather can add a day.",
      ],
    },
    {
      heading: "Shipping cost",
      body: [
        "Shipping is calculated by governorate and shown before you pay — there are no fees added afterwards.",
        "Orders above the free-shipping threshold shown in your cart ship free anywhere in Egypt.",
      ],
    },
    {
      heading: "Tracking",
      body: [
        "You receive an order number the moment checkout completes. Enter that number together with the phone number on the order at the tracking page to see the current status.",
        "Our courier calls before arriving. If you miss the call they attempt delivery twice more before the parcel returns to us.",
      ],
    },
    {
      heading: "Cash on delivery",
      body: [
        "Please have the exact amount ready. Couriers cannot always break large notes.",
        "You may open the parcel and check the piece in front of the courier. You may not try it on before paying.",
      ],
    },
  ],
  ar: [
    {
      heading: "تجهيز الطلب",
      body: [
        "الطلبات التي تصلنا قبل الساعة ٤:٠٠ مساءً بتوقيت القاهرة في أيام العمل تُجهَّز في نفس اليوم. ما بعد ذلك، أو يوم الجمعة، يُشحن في يوم العمل التالي.",
        "كل طلب يُفحص يدوياً قبل تغليفه. إذا لم تجتز القطعة الفحص نوقف الطلب ونتواصل معك بدل أن نشحن شيئاً لسنا راضين عنه.",
      ],
    },
    {
      heading: "مدة التوصيل",
      body: [
        "القاهرة الكبرى والجيزة: من ١ إلى ٣ أيام عمل.",
        "الإسكندرية والدلتا ومدن القناة: من ٢ إلى ٤ أيام عمل.",
        "الصعيد وسيناء والبحر الأحمر والوادي الجديد: من ٣ إلى ٦ أيام عمل.",
        "هذه المدد تقديرية من شركات الشحن وليست ضماناً. الأعياد والأحوال الجوية قد تضيف يوماً.",
      ],
    },
    {
      heading: "تكلفة الشحن",
      body: [
        "تُحسب تكلفة الشحن حسب المحافظة وتظهر قبل الدفع — لا توجد رسوم تُضاف بعد ذلك.",
        "الطلبات التي تتجاوز حد الشحن المجاني الظاهر في سلتك تُشحن مجاناً داخل مصر.",
      ],
    },
    {
      heading: "تتبّع الطلب",
      body: [
        "تحصل على رقم الطلب فور إتمام الشراء. أدخل هذا الرقم مع رقم الهاتف المسجَّل على الطلب في صفحة التتبّع لمعرفة الحالة الحالية.",
        "مندوب الشحن يتصل قبل وصوله. إذا فاتتك المكالمة يحاول التسليم مرتين إضافيتين قبل أن يعود الطرد إلينا.",
      ],
    },
    {
      heading: "الدفع عند الاستلام",
      body: [
        "يُرجى تجهيز المبلغ بالضبط، فليس لدى المندوب دائماً فكّة للفئات الكبيرة.",
        "يمكنك فتح الطرد ومعاينة القطعة أمام المندوب، لكن لا يمكن قياسها قبل الدفع.",
      ],
    },
  ],
};

/* -------------------------------------------------------------------- *
 * Returns
 * -------------------------------------------------------------------- */
export const RETURNS: Bilingual<Block[]> = {
  en: [
    {
      heading: "14 days to decide",
      body: [
        "You have 14 days from the day the parcel reaches you to request a return or an exchange. Tell us within that window and we arrange collection.",
      ],
    },
    {
      heading: "Condition",
      body: [
        "The piece must be unworn and unwashed, with every original tag still attached, in the packaging it arrived in.",
        "We cannot accept a piece that smells of perfume, smoke or deodorant, or that shows makeup marks — those count as worn.",
      ],
    },
    {
      heading: "Exchanges",
      body: [
        "Size exchanges are free once per order inside Egypt. We collect the original piece and deliver the new size in the same trip wherever the courier allows it.",
        "If the size you want has sold out in the meantime we refund you in full instead.",
      ],
    },
    {
      heading: "Refunds",
      body: [
        "Cash-on-delivery orders are refunded by InstaPay or bank transfer to the account you nominate, within 5 working days of the returned piece passing inspection.",
        "InstaPay orders are refunded to the account the payment came from.",
        "Original shipping is refunded only when the return is caused by our error — the wrong item, a manufacturing fault, or damage in transit.",
      ],
    },
    {
      heading: "Faulty or wrong items",
      body: [
        "Send photographs to our WhatsApp with your order number the day the parcel arrives. If we got it wrong, we collect it, replace it and cover every cost.",
      ],
    },
    {
      heading: "What we cannot take back",
      body: [
        "Items marked final sale, and any piece returned after the 14-day window has closed.",
      ],
    },
  ],
  ar: [
    {
      heading: "١٤ يوماً للقرار",
      body: [
        "لديك ١٤ يوماً من تاريخ استلام الطرد لطلب الإرجاع أو الاستبدال. أخبرنا خلال هذه المدة وسنرتّب استلام القطعة.",
      ],
    },
    {
      heading: "حالة القطعة",
      body: [
        "يجب أن تكون القطعة غير مُستخدَمة وغير مغسولة، وجميع البطاقات الأصلية مثبّتة، وبنفس التغليف الذي وصلت به.",
        "لا يمكننا قبول قطعة بها رائحة عطر أو دخان أو مزيل عرق، أو عليها آثار مكياج — فهذه تُعتبر مُستخدَمة.",
      ],
    },
    {
      heading: "الاستبدال",
      body: [
        "استبدال المقاس مجاني مرة واحدة لكل طلب داخل مصر. نستلم القطعة الأصلية ونسلّم المقاس الجديد في نفس الزيارة حيثما سمح المندوب بذلك.",
        "إذا نفد المقاس المطلوب في هذه الأثناء نردّ لك المبلغ كاملاً بدلاً من ذلك.",
      ],
    },
    {
      heading: "استرداد المبلغ",
      body: [
        "طلبات الدفع عند الاستلام تُسترد عبر إنستا باي أو تحويل بنكي على الحساب الذي تحدده، خلال ٥ أيام عمل من اجتياز القطعة المرتجعة للفحص.",
        "طلبات إنستا باي تُسترد على نفس الحساب الذي تم الدفع منه.",
        "تُردّ تكلفة الشحن الأصلية فقط إذا كان الإرجاع بسبب خطأ منّا — قطعة خاطئة أو عيب تصنيع أو تلف أثناء الشحن.",
      ],
    },
    {
      heading: "القطع المعيبة أو الخاطئة",
      body: [
        "أرسل صوراً على واتساب مع رقم الطلب في نفس يوم وصول الطرد. إذا كان الخطأ منّا، نستلم القطعة ونستبدلها ونتحمّل كل التكاليف.",
      ],
    },
    {
      heading: "ما لا يمكن إرجاعه",
      body: ["القطع المعلَّمة كتخفيض نهائي، وأي قطعة بعد انتهاء مهلة الـ ١٤ يوماً."],
    },
  ],
};

/* -------------------------------------------------------------------- *
 * Privacy
 * -------------------------------------------------------------------- */
export const PRIVACY: Bilingual<Block[]> = {
  en: [
    {
      heading: "What we collect",
      body: [
        "To fulfil an order we collect your name, phone number, delivery address, and your email address when you give us one. If you pay by InstaPay we also store the payment screenshot you upload so we can match the transfer to your order.",
        "If you create an account we store your saved addresses and your wishlist against it.",
        "MOSCOW Fit AI answers — height, weight, body shape and preferred fit — are processed in your browser and on our server to produce a recommendation. They are not stored against your account and are not used for advertising.",
      ],
    },
    {
      heading: "How we use it",
      body: [
        "To pick, pack, ship and support your order, and to contact you about that order.",
        "To send marketing email only if you subscribed to the newsletter. Every newsletter has an unsubscribe link.",
        "We do not sell your data. We do not share it with anyone beyond the courier handling your parcel and the infrastructure providers hosting this site.",
      ],
    },
    {
      heading: "Security",
      body: [
        "Passwords are stored as salted scrypt hashes — we cannot read them, and neither can anyone who obtains the database.",
        "Sessions use signed, HTTP-only cookies that JavaScript cannot read.",
        "Administrative access is restricted to named accounts and every write passes through server-side authorisation.",
      ],
    },
    {
      heading: "Retention",
      body: [
        "Order records are kept for seven years to satisfy Egyptian accounting obligations.",
        "You may ask us to delete your account and wishlist at any time. Completed order records are retained in anonymised form.",
      ],
    },
    {
      heading: "Your rights",
      body: [
        "Write to us to request a copy of what we hold about you, to correct it, or to delete it. We respond within 30 days.",
      ],
    },
  ],
  ar: [
    {
      heading: "البيانات التي نجمعها",
      body: [
        "لتنفيذ الطلب نجمع اسمك ورقم هاتفك وعنوان التسليم، وبريدك الإلكتروني إن قدّمته. وعند الدفع بإنستا باي نحتفظ أيضاً بصورة التحويل التي ترفعها لمطابقتها بطلبك.",
        "إذا أنشأت حساباً نحفظ عناوينك المسجّلة وقائمة أمنياتك عليه.",
        "إجابات MOSCOW Fit AI — الطول والوزن وشكل الجسم والقَصّة المفضّلة — تُعالَج في متصفحك وعلى خادمنا لإنتاج التوصية فقط. لا تُحفظ على حسابك ولا تُستخدم في الإعلانات.",
      ],
    },
    {
      heading: "كيف نستخدمها",
      body: [
        "لتجهيز طلبك وتغليفه وشحنه ودعمه، وللتواصل معك بخصوص هذا الطلب.",
        "لإرسال رسائل تسويقية فقط إذا اشتركت في النشرة البريدية، وكل رسالة تحتوي على رابط لإلغاء الاشتراك.",
        "لا نبيع بياناتك ولا نشاركها مع أي جهة خارج شركة الشحن التي تنقل طردك ومزوّدي البنية التقنية الذين يستضيفون هذا الموقع.",
      ],
    },
    {
      heading: "الأمان",
      body: [
        "كلمات المرور تُحفظ كتجزئة scrypt مع مِلح عشوائي — لا يمكننا قراءتها، ولا يمكن لمن يحصل على قاعدة البيانات قراءتها.",
        "الجلسات تستخدم كوكيز موقَّعة من نوع HTTP-only لا تستطيع الجافاسكريبت قراءتها.",
        "صلاحيات الإدارة مقصورة على حسابات محدّدة، وكل عملية كتابة تمرّ عبر تحقق على الخادم.",
      ],
    },
    {
      heading: "مدة الاحتفاظ",
      body: [
        "تُحفظ سجلات الطلبات سبع سنوات التزاماً بالمتطلبات المحاسبية المصرية.",
        "يمكنك طلب حذف حسابك وقائمة أمنياتك في أي وقت، وتبقى سجلات الطلبات المكتملة بصيغة مجهولة الهوية.",
      ],
    },
    {
      heading: "حقوقك",
      body: [
        "راسلنا لطلب نسخة من بياناتك لدينا أو لتصحيحها أو حذفها. نردّ خلال ٣٠ يوماً.",
      ],
    },
  ],
};

/* -------------------------------------------------------------------- *
 * Terms
 * -------------------------------------------------------------------- */
export const TERMS: Bilingual<Block[]> = {
  en: [
    {
      heading: "Agreement",
      body: [
        "Using this site or placing an order means you accept these terms. If you do not accept them, please do not order.",
      ],
    },
    {
      heading: "Orders",
      body: [
        "An order is an offer to buy. It becomes a contract once we confirm it. We may decline an order — for example when a piece is out of stock, a price is clearly wrong, or we cannot verify the delivery details — and we will tell you why.",
        "Stock is reserved only when the order is placed, not when an item sits in your cart.",
      ],
    },
    {
      heading: "Pricing",
      body: [
        "All prices are in Egyptian Pounds and include applicable taxes. Shipping is shown separately before you pay.",
        "We may change prices at any time. The price you saw at checkout is the price that applies to your order.",
      ],
    },
    {
      heading: "Product representation",
      body: [
        "Every product image on this site is a real photograph of the actual garment. We do not retouch garments to change their colour, cut, stitching or detailing, and we do not use rendered or AI-generated images of our products.",
        "Screen calibration varies, so a colour may read slightly differently on your device.",
        "MOSCOW Fit AI gives guidance, not a guarantee. It works from the measurements published for each product and from the answers you give. The final size choice is always yours.",
      ],
    },
    {
      heading: "Intellectual property",
      body: [
        "The MOSCOW name, the monogram, our photography and the content of this site belong to MOSCOW. Do not reproduce them commercially without written permission.",
      ],
    },
    {
      heading: "Liability",
      body: [
        "Our liability for any order is limited to the amount you paid for it. We are not liable for delays caused by couriers, weather or events outside our control.",
      ],
    },
    {
      heading: "Governing law",
      body: ["These terms are governed by the laws of the Arab Republic of Egypt."],
    },
  ],
  ar: [
    {
      heading: "الاتفاق",
      body: [
        "استخدامك لهذا الموقع أو إتمامك لطلب يعني قبولك لهذه الشروط. إن لم تكن موافقاً عليها، يُرجى عدم الطلب.",
      ],
    },
    {
      heading: "الطلبات",
      body: [
        "الطلب هو عرض للشراء، ويصبح عقداً بعد تأكيدنا له. يحق لنا رفض طلب — مثلاً عند نفاد القطعة أو وجود خطأ واضح في السعر أو تعذّر التحقق من بيانات التسليم — وسنوضح لك السبب.",
        "يُحجز المخزون عند إتمام الطلب فقط، لا عند إضافة القطعة إلى السلة.",
      ],
    },
    {
      heading: "الأسعار",
      body: [
        "جميع الأسعار بالجنيه المصري وشاملة الضرائب المطبّقة، وتظهر تكلفة الشحن منفصلة قبل الدفع.",
        "قد نغيّر الأسعار في أي وقت، والسعر المعتمد لطلبك هو السعر الذي رأيته عند إتمام الشراء.",
      ],
    },
    {
      heading: "تمثيل المنتجات",
      body: [
        "كل صورة منتج على هذا الموقع هي صورة فوتوغرافية حقيقية للقطعة الفعلية. لا نعدّل على القطع لتغيير لونها أو قصّتها أو خياطتها أو تفاصيلها، ولا نستخدم صوراً مُولَّدة أو ثلاثية الأبعاد لمنتجاتنا.",
        "تختلف معايرة الشاشات، لذا قد يظهر اللون مختلفاً قليلاً على جهازك.",
        "MOSCOW Fit AI يقدّم إرشاداً لا ضماناً. يعمل من المقاسات المنشورة لكل منتج ومن إجاباتك أنت، ويبقى اختيار المقاس النهائي لك.",
      ],
    },
    {
      heading: "الملكية الفكرية",
      body: [
        "اسم موسكو والمونوغرام وصورنا ومحتوى هذا الموقع ملك لموسكو. لا يجوز إعادة إنتاجها تجارياً دون إذن كتابي.",
      ],
    },
    {
      heading: "حدود المسؤولية",
      body: [
        "تقتصر مسؤوليتنا عن أي طلب على المبلغ الذي دفعته فيه. ولا نتحمّل مسؤولية التأخير الناتج عن شركات الشحن أو الأحوال الجوية أو أي ظرف خارج عن إرادتنا.",
      ],
    },
    {
      heading: "القانون الواجب التطبيق",
      body: ["تخضع هذه الشروط لقوانين جمهورية مصر العربية."],
    },
  ],
};
