import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { LEGAL_ENTITY } from "~/utils/legalEntity";

export const handle = { i18n: ["common"] };

export const meta: MetaFunction = () => [
  { title: "Όροι Χρήσης | GregKyrMaths" },
  {
    name: "description",
    content:
      "Όροι χρήσης της πλατφόρμας GregKyrMaths για ασκήσεις, βιβλία, το Greg AI και την κοινότητα Ερωτήσεων & Απαντήσεων.",
  },
];

const LAST_UPDATED = "2026-10-25";

const UseOfTerms = () => {
  const { i18n } = useTranslation();
  const isGreek = i18n.language?.startsWith("el");

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10 prose prose-slate">
      {isGreek ? <GreekTerms /> : <EnglishTerms />}
      <hr className="my-10" />
      <p className="text-sm text-gray-500">
        {isGreek ? "Τελευταία ενημέρωση: " : "Last updated: "}
        {LAST_UPDATED}
      </p>
    </main>
  );
};

const ProviderDetails = ({ lang }: { lang: "el" | "en" }) => {
  const e = LEGAL_ENTITY;
  const el = lang === "el";
  return (
    <ul>
      <li>
        {el ? "Ονοματεπώνυμο: " : "Name: "}
        {e.name[lang]}
      </li>
      {e.address[lang] && (
        <li>
          {el ? "Διεύθυνση: " : "Address: "}
          {e.address[lang]}
        </li>
      )}
      {e.vatNumber && (
        <li>
          {el ? "ΑΦΜ: " : "Tax ID (ΑΦΜ): "}
          {e.vatNumber}
          {e.taxOffice[lang] && (el ? `, ΔΟΥ ${e.taxOffice.el}` : `, Tax office ${e.taxOffice.en}`)}
        </li>
      )}
      {e.gemi && <li>{el ? `ΓΕΜΗ: ${e.gemi}` : `GEMI: ${e.gemi}`}</li>}
      <li>Email: {e.email}</li>
      <li>
        {el ? "Τηλέφωνο: " : "Phone: "}
        {e.phone}
      </li>
    </ul>
  );
};

const GreekTerms = () => (
  <>
    <h1>Όροι Χρήσης</h1>

    <p>
      Καλώς ήρθατε στο <strong>GregKyrMaths</strong>. Οι παρόντες Όροι Χρήσης
      («Όροι») διέπουν τη χρήση της ιστοσελίδας και όλων των υπηρεσιών που
      παρέχονται μέσω αυτής (η «Πλατφόρμα»). Για τη δημιουργία λογαριασμού
      ζητείται η ρητή αποδοχή τους.
    </p>

    <h2>1. Πάροχος υπηρεσίας</h2>
    <p>
      Η Πλατφόρμα λειτουργεί από τον Γρηγόρη Κυρίτση, καθηγητή μαθηματικών (στο
      εξής «εμείς», «μας» ή «Πάροχος»):
    </p>
    <ProviderDetails lang="el" />

    <h2>2. Περιγραφή υπηρεσιών</h2>
    <p>Η Πλατφόρμα προσφέρει:</p>
    <ul>
      <li>Δωρεάν πρόσβαση σε μαθηματικές ασκήσεις (PDF) και υλικό εξάσκησης.</li>
      <li>
        Πώληση ψηφιακών βιβλίων μαθηματικών μέσω ασφαλούς πληρωμής με κάρτα.
      </li>
      <li>
        Το <strong>Greg AI</strong>, έναν βοηθό μαθηματικών που λειτουργεί με
        τεχνητή νοημοσύνη (ενότητα 5).
      </li>
      <li>
        Δωρεάν κοινότητα Ερωτήσεων &amp; Απαντήσεων (Q&amp;A) για χρήστες με
        λογαριασμό.
      </li>
      <li>Βίντεο-μαθήματα και υποστηρικτικό εκπαιδευτικό περιεχόμενο.</li>
    </ul>

    <h2>3. Λογαριασμός χρήστη και ανήλικοι</h2>
    <p>
      Για ορισμένες λειτουργίες (Greg AI, αγορά βιβλίου, Q&amp;A) απαιτείται
      λογαριασμός. Ο χρήστης δηλώνει ότι:
    </p>
    <ul>
      <li>Παρέχει αληθή στοιχεία, συμπεριλαμβανομένης της ηλικίας του.</li>
      <li>
        Είναι υπεύθυνος για τη φύλαξη του κωδικού του και για κάθε
        δραστηριότητα μέσω του λογαριασμού του.
      </li>
    </ul>
    <p>
      <strong>Χρήστες κάτω των 15 ετών:</strong> σύμφωνα με το άρθρο 21 του Ν.
      4624/2019, κατά την εγγραφή δηλώνεται email γονέα ή κηδεμόνα, στο οποίο
      στέλνουμε αίτημα επιβεβαίωσης. Μέχρι να επιβεβαιώσει ο γονέας, το Greg AI
      παραμένει κλειδωμένο. Αν ο γονέας αρνηθεί, ο λογαριασμός διαγράφεται.
      Αγορές βιβλίων από ανηλίκους πρέπει να γίνονται με τη σύμφωνη γνώμη
      γονέα ή κηδεμόνα.
    </p>
    <p>
      Μπορείτε να κατεβάσετε τα δεδομένα σας ή να διαγράψετε τον λογαριασμό σας
      οποιαδήποτε στιγμή από τη σελίδα <Link to="/account">Λογαριασμός</Link>.
      Διατηρούμε το δικαίωμα αναστολής ή διαγραφής λογαριασμών που παραβιάζουν
      τους παρόντες Όρους.
    </p>

    <h2>4. Πληρωμές, παράδοση και υπαναχώρηση</h2>
    <p>
      Οι πληρωμές για τα ψηφιακά βιβλία διεκπεραιώνονται μέσω του παρόχου{" "}
      <strong>Stripe</strong>. Δεν αποθηκεύουμε στοιχεία κάρτας. Οι τιμές
      εμφανίζονται σε ευρώ (€) και περιλαμβάνουν τον αναλογούντα ΦΠΑ.
    </p>
    <p>
      Μετά την επιτυχή πληρωμή, το βιβλίο είναι διαθέσιμο αμέσως για λήψη από
      τη σελίδα των αγορών σας.
    </p>
    <p>
      <strong>Υπαναχώρηση:</strong> Κατά κανόνα ο καταναλωτής έχει δικαίωμα
      υπαναχώρησης 14 ημερών. Για ψηφιακό περιεχόμενο που δεν παρέχεται σε υλικό
      μέσο, ο Ν. 2251/1994 προβλέπει ότι το δικαίωμα αυτό δεν ισχύει όταν η
      παράδοση ξεκινά με την πρότερη ρητή συγκατάθεσή σας και την αναγνώρισή σας
      ότι έτσι χάνετε το δικαίωμα υπαναχώρησης. Τη συγκατάθεση αυτή τη δίνετε
      με το σχετικό πεδίο πριν από την πληρωμή, και την επιβεβαιώνουμε στην
      απόδειξη αγοράς. Σε περίπτωση τεχνικού προβλήματος ή αδυναμίας λήψης,
      επικοινωνήστε μαζί μας για επαναποστολή ή επιστροφή χρημάτων. Τα νόμιμα
      δικαιώματά σας για ελαττωματικό ψηφιακό περιεχόμενο δεν θίγονται.
    </p>

    <h2>5. Greg AI</h2>
    <ul>
      <li>
        Το Greg AI είναι <strong>σύστημα τεχνητής νοημοσύνης</strong>, όχι
        άνθρωπος, και δεν είναι ο καθηγητής Γρηγόρης Κυρίτσης. Λειτουργεί με
        μοντέλα της Anthropic.
      </li>
      <li>
        Οι απαντήσεις του παράγονται αυτόματα και <strong>μπορεί να περιέχουν
        λάθη</strong>. Ελέγχετε τις λύσεις και ρωτήστε τον καθηγητή όταν έχετε
        αμφιβολία. Το Greg AI δεν αντικαθιστά τη διδασκαλία.
      </li>
      <li>
        Οι συνομιλίες αποθηκεύονται και μπορεί να τις διαβάσει ο καθηγητής, όπως
        περιγράφει η <Link to="/privacyPolicy">Πολιτική Απορρήτου</Link>. Μην
        γράφετε ευαίσθητα προσωπικά στοιχεία.
      </li>
      <li>
        Υπάρχει ημερήσιο όριο χρήσης. Απαγορεύεται η κατάχρηση (π.χ.
        αυτοματοποιημένα αιτήματα, προσπάθειες παράκαμψης των κανόνων του,
        προσβλητικό περιεχόμενο ή χρήση του κατά τη διάρκεια εξετάσεων όπου δεν
        επιτρέπεται).
      </li>
      <li>
        Μπορούμε να περιορίσουμε ή να διακόψουμε το Greg AI για λόγους
        ασφάλειας, κόστους ή συντήρησης.
      </li>
    </ul>

    <h2>6. Πνευματικά δικαιώματα</h2>
    <p>
      Όλο το εκπαιδευτικό περιεχόμενο της Πλατφόρμας (ασκήσεις, βιβλία,
      βίντεο-μαθήματα, εικόνες, λογότυπα, κείμενα) αποτελεί πνευματική
      ιδιοκτησία του Παρόχου ή των αντίστοιχων δικαιούχων και προστατεύεται από
      την ελληνική και διεθνή νομοθεσία. Παραχωρείται μη αποκλειστική, μη
      μεταβιβάσιμη άδεια προσωπικής, μη εμπορικής χρήσης για εκπαιδευτικούς
      σκοπούς.
    </p>
    <p>Απαγορεύεται ρητά:</p>
    <ul>
      <li>Η αναπαραγωγή, διανομή ή μεταπώληση του περιεχομένου σε τρίτους.</li>
      <li>
        Η ανάρτηση αγορασμένων βιβλίων ή PDF σε δημόσιες ή ιδιωτικές πλατφόρμες.
      </li>
      <li>
        Η χρήση του περιεχομένου για εκπαίδευση μοντέλων τεχνητής νοημοσύνης
        χωρίς γραπτή άδειά μας.
      </li>
    </ul>

    <h2>7. Περιεχόμενο χρήστη (Q&amp;A)</h2>
    <p>
      Οι χρήστες μπορούν να υποβάλλουν ερωτήσεις, απαντήσεις, σχόλια και ετικέτες
      («Περιεχόμενο Χρήστη»). Δημοσιεύοντας Περιεχόμενο Χρήστη:
    </p>
    <ul>
      <li>Διατηρείτε την κυριότητά του.</li>
      <li>
        Παραχωρείτε στον Πάροχο μη αποκλειστική, χωρίς αντάλλαγμα άδεια
        προβολής, αναπαραγωγής και αρχειοθέτησής του εντός της Πλατφόρμας.
      </li>
      <li>
        Δηλώνετε ότι το περιεχόμενο είναι δικό σας και δεν παραβιάζει
        δικαιώματα τρίτων.
      </li>
    </ul>
    <p>
      Διατηρούμε το δικαίωμα να αφαιρέσουμε Περιεχόμενο Χρήστη που παραβιάζει
      τους Όρους ή τη νομοθεσία. Για να αναφέρετε παράνομο περιεχόμενο,
      χρησιμοποιήστε τη <Link to="/contact">φόρμα επικοινωνίας</Link>.
    </p>

    <h2>8. Απαγορευμένη χρήση</h2>
    <p>Δεσμεύεστε να μη χρησιμοποιείτε την Πλατφόρμα για:</p>
    <ul>
      <li>Παράνομες, υβριστικές, διακριτικές ή προσβλητικές αναρτήσεις.</li>
      <li>Spam ή εμπορική προώθηση χωρίς γραπτή έγκριση.</li>
      <li>
        Παράκαμψη μηχανισμών ασφαλείας, scraping ή αυτοματοποιημένα αιτήματα
        πέραν εύλογου ορίου.
      </li>
      <li>Αντιγραφή ή μεταπώληση του εκπαιδευτικού περιεχομένου.</li>
      <li>Πλαστοπροσωπία άλλου χρήστη, εκπαιδευτικού ή του Παρόχου.</li>
    </ul>

    <h2>9. Διαθεσιμότητα και αλλαγές</h2>
    <p>
      Καταβάλλουμε εύλογη προσπάθεια ώστε η Πλατφόρμα να είναι διαθέσιμη, χωρίς
      να εγγυώμαστε αδιάλειπτη λειτουργία. Διατηρούμε το δικαίωμα προσωρινής
      διακοπής για συντήρηση, αναβάθμιση ή ασφάλεια, καθώς και τροποποίησης ή
      διακοπής τμημάτων της υπηρεσίας. Οι αγορασμένες λήψεις παραμένουν
      διαθέσιμες σύμφωνα με τους όρους αγοράς.
    </p>

    <h2>10. Ευθύνη</h2>
    <p>
      Το εκπαιδευτικό υλικό και οι απαντήσεις του Greg AI παρέχονται για
      εκπαιδευτικούς σκοπούς. Καταβάλλουμε κάθε εύλογη προσπάθεια για την
      ορθότητά τους, χωρίς να εγγυώμαστε ότι είναι απαλλαγμένα από λάθη ή ότι
      θα οδηγήσουν σε συγκεκριμένα αποτελέσματα. Δεν περιορίζεται η ευθύνη μας
      για δόλο ή βαριά αμέλεια, ούτε τα δικαιώματα που σας παρέχει η νομοθεσία
      για την προστασία των καταναλωτών.
    </p>

    <h2>11. Τροποποίηση Όρων</h2>
    <p>
      Ενδέχεται να τροποποιούμε τους παρόντες Όρους. Ουσιώδεις αλλαγές
      ανακοινώνονται στην Πλατφόρμα ή με email πριν τεθούν σε ισχύ, και για τη
      συνέχιση της χρήσης λειτουργιών με λογαριασμό ζητείται εκ νέου αποδοχή.
    </p>

    <h2>12. Εφαρμοστέο δίκαιο, επίλυση διαφορών</h2>
    <p>
      Οι Όροι διέπονται από το ελληνικό δίκαιο. Πριν από κάθε δικαστική ενέργεια
      σας παρακαλούμε να επικοινωνήσετε μαζί μας μέσω της σελίδας{" "}
      <Link to="/contact">Επικοινωνία</Link> για φιλική επίλυση. Ως καταναλωτής
      μπορείτε επίσης να απευθυνθείτε σε φορέα εναλλακτικής επίλυσης διαφορών,
      όπως ο{" "}
      <a href="https://www.synigoroskatanaloti.gr" target="_blank" rel="noopener noreferrer">
        Συνήγορος του Καταναλωτή
      </a>
      .{" "}
      {LEGAL_ENTITY.city.el
        ? `Αρμόδια είναι τα δικαστήρια της ${LEGAL_ENTITY.city.el}, με την επιφύλαξη του δικαιώματος του καταναλωτή να προσφύγει στα δικαστήρια του τόπου κατοικίας του.`
        : "Ο καταναλωτής διατηρεί πάντα το δικαίωμα να προσφύγει στα δικαστήρια του τόπου κατοικίας του."}
    </p>

    <h2>13. Επικοινωνία</h2>
    <p>
      Για ερωτήσεις σχετικά με τους παρόντες Όρους επικοινωνήστε στο email{" "}
      <strong>{LEGAL_ENTITY.email}</strong> ή μέσω της{" "}
      <Link to="/contact">φόρμας επικοινωνίας</Link>.
    </p>

    <p>
      Δείτε επίσης την <Link to="/privacyPolicy">Πολιτική Απορρήτου</Link> για
      τον τρόπο επεξεργασίας των προσωπικών σας δεδομένων.
    </p>
  </>
);

const EnglishTerms = () => (
  <>
    <h1>Terms of Use</h1>

    <p>
      Welcome to <strong>GregKyrMaths</strong>. These Terms of Use (the
      &ldquo;Terms&rdquo;) govern your use of the website and all services
      provided through it (the &ldquo;Platform&rdquo;). Creating an account
      requires that you expressly accept them.
    </p>

    <h2>1. Service provider</h2>
    <p>
      The Platform is operated by Grigoris Kyritsis, mathematics teacher
      (&ldquo;we&rdquo;, &ldquo;us&rdquo; or the &ldquo;Provider&rdquo;):
    </p>
    <ProviderDetails lang="en" />

    <h2>2. Description of services</h2>
    <p>The Platform offers:</p>
    <ul>
      <li>Free access to mathematics exercises (PDF) and practice material.</li>
      <li>Sale of digital mathematics books via secure card payment.</li>
      <li>
        <strong>Greg AI</strong>, an artificial-intelligence math assistant
        (section 5).
      </li>
      <li>A free Q&amp;A community for registered users.</li>
      <li>Video lessons and supporting educational content.</li>
    </ul>

    <h2>3. User account and minors</h2>
    <p>
      Some features (Greg AI, purchasing a book, Q&amp;A) require an account.
      By creating one, you confirm that:
    </p>
    <ul>
      <li>The information you provide, including your age, is accurate.</li>
      <li>
        You are responsible for safeguarding your password and for any activity
        under your account.
      </li>
    </ul>
    <p>
      <strong>Users under 15:</strong> under Article 21 of Greek Law 4624/2019,
      signup asks for a parent&rsquo;s or guardian&rsquo;s email, to which we
      send a confirmation request. Greg AI stays locked until the parent
      confirms. If the parent declines, the account is deleted. Book purchases
      by minors must be made with a parent&rsquo;s or guardian&rsquo;s
      agreement.
    </p>
    <p>
      You can download your data or delete your account at any time from the{" "}
      <Link to="/account">Account</Link> page. We may suspend or terminate
      accounts that violate these Terms.
    </p>

    <h2>4. Payments, delivery and withdrawal</h2>
    <p>
      Payments for digital books are processed by <strong>Stripe</strong>. We
      do not store card details. Prices are shown in euros (€) and include
      applicable VAT.
    </p>
    <p>
      After successful payment, the book is immediately available for download
      from your purchases page.
    </p>
    <p>
      <strong>Right of withdrawal:</strong> Consumers normally have a 14-day
      right of withdrawal. For digital content not supplied on a tangible
      medium, Greek Law 2251/1994 provides that this right does not apply once
      delivery starts with your prior express consent and your acknowledgement
      that you thereby lose the right of withdrawal. You give this consent with
      the checkbox before payment, and we confirm it in your purchase receipt.
      If there is a technical problem or you cannot download, contact us for a
      re-send or refund. Your statutory rights for defective digital content
      are not affected.
    </p>

    <h2>5. Greg AI</h2>
    <ul>
      <li>
        Greg AI is an <strong>artificial-intelligence system</strong>, not a
        person, and it is not the teacher Grigoris Kyritsis. It runs on
        Anthropic&rsquo;s models.
      </li>
      <li>
        Its replies are generated automatically and{" "}
        <strong>may contain mistakes</strong>. Check solutions and ask the
        teacher when in doubt. Greg AI does not replace teaching.
      </li>
      <li>
        Conversations are stored and may be read by the teacher, as described
        in the <Link to="/privacyPolicy">Privacy Policy</Link>. Do not share
        sensitive personal information.
      </li>
      <li>
        There is a daily usage limit. Abuse is prohibited (e.g. automated
        requests, attempts to get around its rules, offensive content, or using
        it during exams where this is not allowed).
      </li>
      <li>
        We may limit or suspend Greg AI for security, cost or maintenance
        reasons.
      </li>
    </ul>

    <h2>6. Intellectual property</h2>
    <p>
      All educational content on the Platform (exercises, books, video
      lessons, images, logos, copy) is the intellectual property of the
      Provider or the respective rights holders, protected by Greek and
      international law. You are granted a non-exclusive, non-transferable
      licence for personal, non-commercial educational use.
    </p>
    <p>The following are expressly prohibited:</p>
    <ul>
      <li>Reproducing, distributing or reselling the content to third parties.</li>
      <li>Uploading purchased books or PDFs to public or private platforms.</li>
      <li>
        Using the content to train artificial intelligence models without our
        written permission.
      </li>
    </ul>

    <h2>7. User-generated content (Q&amp;A)</h2>
    <p>
      Users may post questions, answers, comments and tags (&ldquo;User
      Content&rdquo;). By posting User Content:
    </p>
    <ul>
      <li>You retain ownership of it.</li>
      <li>
        You grant the Provider a non-exclusive, royalty-free licence to
        display, reproduce and archive it within the Platform.
      </li>
      <li>
        You confirm that the content is yours and does not infringe the rights
        of any third party.
      </li>
    </ul>
    <p>
      We may remove User Content that violates these Terms or the law. To
      report illegal content, use the <Link to="/contact">contact form</Link>.
    </p>

    <h2>8. Prohibited use</h2>
    <p>You agree not to use the Platform for:</p>
    <ul>
      <li>Illegal, abusive, discriminatory or offensive postings.</li>
      <li>Spam or commercial promotion without written approval.</li>
      <li>
        Bypassing security mechanisms, scraping or automated requests beyond a
        reasonable limit.
      </li>
      <li>Copying or reselling educational content.</li>
      <li>Impersonating any other user, teacher or the Provider.</li>
    </ul>

    <h2>9. Availability and changes</h2>
    <p>
      We make reasonable efforts to keep the Platform available, but do not
      guarantee uninterrupted operation. We may temporarily suspend service for
      maintenance, upgrades or security, and may modify or discontinue parts of
      the service. Purchased downloads remain available under the purchase
      terms.
    </p>

    <h2>10. Liability</h2>
    <p>
      Educational material and Greg AI&rsquo;s replies are provided for
      educational purposes. We make every reasonable effort to ensure they are
      accurate, but do not warrant that they are error-free or will produce
      specific results. Nothing in these Terms limits our liability for intent
      or gross negligence, or your rights under consumer protection law.
    </p>

    <h2>11. Modifications to Terms</h2>
    <p>
      We may modify these Terms. Material changes are announced on the
      Platform or by email before they take effect, and you will be asked to
      accept them again to keep using account features.
    </p>

    <h2>12. Governing law and disputes</h2>
    <p>
      These Terms are governed by Greek law. Before any legal action, please
      contact us via the <Link to="/contact">Contact</Link> page for an
      amicable resolution. As a consumer you may also turn to an alternative
      dispute resolution body such as the{" "}
      <a href="https://www.synigoroskatanaloti.gr" target="_blank" rel="noopener noreferrer">
        Hellenic Consumer Ombudsman
      </a>
      .{" "}
      {LEGAL_ENTITY.city.en
        ? `The courts of ${LEGAL_ENTITY.city.en} have jurisdiction, without prejudice to a consumer's right to sue in their place of residence.`
        : "Consumers always keep the right to sue in the courts of their place of residence."}
    </p>

    <h2>13. Contact</h2>
    <p>
      For questions about these Terms, contact{" "}
      <strong>{LEGAL_ENTITY.email}</strong> or use the{" "}
      <Link to="/contact">contact form</Link>.
    </p>

    <p>
      See also the <Link to="/privacyPolicy">Privacy Policy</Link> for how we
      process your personal data.
    </p>
  </>
);

export default UseOfTerms;
