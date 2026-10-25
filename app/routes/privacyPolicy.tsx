import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { LEGAL_ENTITY } from "~/utils/legalEntity";

export const handle = { i18n: ["common"] };

export const meta: MetaFunction = () => [
  { title: "Πολιτική Απορρήτου | GregKyrMaths" },
  {
    name: "description",
    content:
      "Πολιτική Απορρήτου σύμφωνα με τον GDPR — ποια δεδομένα συλλέγουμε, πώς τα χρησιμοποιούμε και τα δικαιώματά σας.",
  },
];

const LAST_UPDATED = "2026-10-25";

const PrivacyPolicy = () => {
  const { i18n } = useTranslation();
  const isGreek = i18n.language?.startsWith("el");

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10 prose prose-slate">
      {isGreek ? <GreekPolicy /> : <EnglishPolicy />}
      <hr className="my-10" />
      <p className="text-sm text-gray-500">
        {isGreek ? "Τελευταία ενημέρωση: " : "Last updated: "}
        {LAST_UPDATED}
      </p>
    </main>
  );
};

const ControllerDetails = ({ lang }: { lang: "el" | "en" }) => {
  const e = LEGAL_ENTITY;
  const el = lang === "el";
  return (
    <ul>
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
        </li>
      )}
      <li>Email: {e.email}</li>
      <li>
        {el ? "Τηλέφωνο: " : "Phone: "}
        {e.phone}
      </li>
    </ul>
  );
};

const GreekPolicy = () => (
  <>
    <h1>Πολιτική Απορρήτου</h1>

    <p>
      Η παρούσα Πολιτική Απορρήτου περιγράφει πώς το <strong>GregKyrMaths</strong>{" "}
      («εμείς», «μας») συλλέγει, χρησιμοποιεί και προστατεύει τα προσωπικά σας
      δεδομένα όταν χρησιμοποιείτε την πλατφόρμα. Σεβόμαστε το ιδιωτικό σας
      απόρρητο και δεσμευόμαστε για συμμόρφωση με τον Κανονισμό (ΕΕ) 2016/679
      (GDPR) και τον Ν. 4624/2019.
    </p>

    <div className="not-prose rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-gray-800">
      <p className="font-semibold">Με λίγα λόγια</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Κρατάμε μόνο ό,τι χρειάζεται για να λειτουργεί ο λογαριασμός σου και να μαθαίνεις.</li>
        <li>
          Το Greg AI είναι τεχνητή νοημοσύνη, όχι ο καθηγητής. Οι συζητήσεις σου
          αποθηκεύονται και μπορεί να τις διαβάσει ο καθηγητής Γρηγόρης.
        </li>
        <li>Οι φωτογραφίες που στέλνεις στο Greg AI δεν αποθηκεύονται.</li>
        <li>Αν είσαι κάτω από 15, χρειαζόμαστε την έγκριση γονέα για το Greg AI.</li>
        <li>Δεν πουλάμε τα δεδομένα σου και δεν τα χρησιμοποιούμε για διαφημίσεις.</li>
        <li>
          Μπορείς να κατεβάσεις ή να διαγράψεις τα δεδομένα σου όποτε θέλεις από
          τη σελίδα <Link to="/account">Λογαριασμός</Link>.
        </li>
      </ul>
    </div>

    <h2>1. Υπεύθυνος επεξεργασίας</h2>
    <p>
      Υπεύθυνος επεξεργασίας των δεδομένων σας είναι ο Γρηγόρης Κυρίτσης.
      Στοιχεία επικοινωνίας:
    </p>
    <ControllerDetails lang="el" />

    <h2>2. Ποια δεδομένα συλλέγουμε</h2>
    <h3>2.1 Δεδομένα που παρέχετε εσείς</h3>
    <ul>
      <li>
        <strong>Δημιουργία λογαριασμού:</strong> ονοματεπώνυμο, διεύθυνση
        email, κωδικός πρόσβασης (αποθηκεύεται μόνο σε μορφή κρυπτογραφημένου
        hash με <em>bcrypt</em> — δεν τον γνωρίζουμε ποτέ σε καθαρή μορφή).
      </li>
      <li>
        <strong>Σύνδεση μέσω Google:</strong> εφόσον επιλέξετε σύνδεση μέσω
        Google OAuth, λαμβάνουμε τη δημόσια διεύθυνση email και το όνομα του
        λογαριασμού Google σας.
      </li>
      <li>
        <strong>Επικοινωνία:</strong> όνομα, email, μήνυμα όταν συμπληρώνετε
        τη φόρμα επικοινωνίας.
      </li>
      <li>
        <strong>Περιεχόμενο χρήστη:</strong> οι ερωτήσεις, απαντήσεις και
        ετικέτες που δημοσιεύετε στην κοινότητα Q&amp;A.
      </li>
      <li>
        <strong>Ηλικία και συγκατάθεση:</strong> αν είστε άνω ή κάτω των 15
        ετών, την ημερομηνία αποδοχής των Όρων και της παρούσας Πολιτικής και,
        για χρήστες κάτω των 15, το email του γονέα/κηδεμόνα και την ημερομηνία
        επιβεβαίωσής του.
      </li>
      <li>
        <strong>Newsletter:</strong> το email σας, μόνο αν εγγραφείτε.
      </li>
    </ul>

    <h3>2.2 Δεδομένα που συλλέγονται αυτόματα</h3>
    <ul>
      <li>
        <strong>Cookies απαραίτητα για τη λειτουργία:</strong>{" "}
        <code>gregMaths</code> (συνεδρία σύνδεσης, διάρκεια 30 ημερών),{" "}
        <code>_csrf</code> (προστασία φορμών, 24 ώρες),{" "}
        <code>i18n</code> (επιλογή γλώσσας, διάρκεια 1 έτος). Δεν
        χρησιμοποιούμε cookies διαφήμισης ή παρακολούθησης, γι&apos; αυτό δεν
        ζητείται συγκατάθεση για cookies.
      </li>
      <li>
        <strong>Τοπική αποθήκευση του browser:</strong> το αν κλείσατε την
        ειδοποίηση για αλλαγές της πολιτικής και η σύνδεση στη ζωντανή
        συνομιλία (chat) της κοινότητας.
      </li>
      <li>
        <strong>Βίντεο YouTube:</strong> οι μικρογραφίες φορτώνονται από την
        Google· το βίντεο φορτώνεται σε «λειτουργία βελτιωμένου απορρήτου»
        (youtube-nocookie.com) μόνο όταν πατήσετε αναπαραγωγή.
      </li>
      <li>
        <strong>Τεχνικά δεδομένα:</strong> διεύθυνση IP, τύπος προγράμματος
        περιήγησης, λειτουργικό σύστημα, ώρα επίσκεψης — για λόγους ασφάλειας
        και διάγνωσης σφαλμάτων.
      </li>
      <li>
        <strong>Audit log:</strong> καταγραφή ευαίσθητων ενεργειών (σύνδεση,
        αγορά, διαγραφή) για ασφάλεια και αντιμετώπιση κατάχρησης.
      </li>
      <li>
        <strong>Στατιστικά επισκεψιμότητας (Vercel Analytics):</strong>{" "}
        ανώνυμη και χωρίς cookies καταγραφή προβολών σελίδων, χωρίς
        παρακολούθηση μεταξύ ιστοτόπων.
      </li>
    </ul>

    <h3>2.3 Δεδομένα αγορών</h3>
    <ul>
      <li>
        Ιστορικό αγορών βιβλίων, ώρα συναλλαγής, αναγνωριστικό συνεδρίας Stripe.
      </li>
      <li>
        <strong>Δεν αποθηκεύουμε</strong> στοιχεία πιστωτικής/χρεωστικής κάρτας
        — η πληρωμή πραγματοποιείται απευθείας στις σελίδες της Stripe.
      </li>
    </ul>

    <h3>2.4 Greg AI (ψηφιακός βοηθός μαθηματικών)</h3>
    <p>
      Το Greg AI είναι βοηθός τεχνητής νοημοσύνης, διαθέσιμος μόνο σε
      συνδεδεμένους χρήστες. Όταν το χρησιμοποιείτε:
    </p>
    <ul>
      <li>
        <strong>Αποθηκεύουμε τις συνομιλίες σας</strong> (τα μηνύματά σας και
        τις απαντήσεις του Greg AI), ώστε να μπορείτε να τις ξανανοίξετε από το
        ιστορικό.
      </li>
      <li>
        <strong>Φωτογραφίες:</strong> αν στείλετε φωτογραφία άσκησης, αυτή
        σμικρύνεται στη συσκευή σας και αποστέλλεται μία φορά στον πάροχο
        τεχνητής νοημοσύνης μαζί με το μήνυμα.{" "}
        <strong>Δεν την αποθηκεύουμε</strong> — αποθηκεύεται μόνο η απάντηση
        του Greg AI.
      </li>
      <li>
        <strong>Εξατομίκευση:</strong> την τάξη που δηλώνετε, το μικρό σας
        όνομα, τις ασκήσεις που έχετε δει, τις βαθμολογίες της εξάσκησης και τα
        θέματα όπου ζητήσατε πρόσφατα βοήθεια, ώστε οι εξηγήσεις να ταιριάζουν
        στο επίπεδό σας.
      </li>
      <li>
        <strong>Αξιολογήσεις και χρήση:</strong> τα 👍/👎 που δίνετε στις
        απαντήσεις και τον ημερήσιο αριθμό μηνυμάτων (για το όριο χρήσης).
      </li>
      <li>
        <strong>Ανασκόπηση από τον καθηγητή:</strong> ο Γρηγόρης Κυρίτσης, ως
        καθηγητής, μπορεί να διαβάζει τις συνομιλίες και τις αξιολογήσεις για
        να βελτιώνει το εκπαιδευτικό υλικό, να εντοπίζει λάθη του Greg AI και
        να διασφαλίζει την ασφαλή χρήση. Οι συνομιλίες δεν δημοσιεύονται και δεν
        κοινοποιούνται σε τρίτους.
      </li>
      <li>
        <strong>Αποστολή στον καθηγητή:</strong> μια συνομιλία αποστέλλεται με
        email στον καθηγητή <strong>μόνο</strong> αν πατήσετε εσείς «Στείλε αυτή
        τη συζήτηση στον Greg».
      </li>
      <li>
        Τα μηνύματα επεξεργάζεται η Anthropic (βλ. ενότητα 4), η οποία δεν
        χρησιμοποιεί δεδομένα από την υπηρεσία μας για την εκπαίδευση των
        μοντέλων της και τα διαγράφει εντός 30 ημερών (έως 2 έτη μόνο αν ένα
        μήνυμα επισημανθεί για παραβίαση των κανόνων χρήσης της). Μην γράφετε
        στο Greg AI ευαίσθητα προσωπικά στοιχεία.
      </li>
      <li>
        Οι απαντήσεις του Greg AI παράγονται αυτόματα και μπορεί να περιέχουν
        λάθη. Δεν λαμβάνονται αυτοματοποιημένες αποφάσεις με νομικές ή
        παρόμοιες συνέπειες για εσάς (άρθρ. 22 GDPR).
      </li>
    </ul>

    <h2>3. Σκοποί και νομική βάση επεξεργασίας</h2>
    <table className="text-sm">
      <thead>
        <tr>
          <th>Σκοπός</th>
          <th>Νομική βάση (GDPR άρθρ. 6)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Δημιουργία και διαχείριση λογαριασμού</td>
          <td>Εκτέλεση σύμβασης (παρ. 1β)</td>
        </tr>
        <tr>
          <td>Πώληση και αποστολή ψηφιακών βιβλίων</td>
          <td>Εκτέλεση σύμβασης (παρ. 1β)</td>
        </tr>
        <tr>
          <td>Δημοσίευση ερωτήσεων/απαντήσεων στο Q&amp;A</td>
          <td>Συγκατάθεση + εκτέλεση σύμβασης</td>
        </tr>
        <tr>
          <td>Παροχή του Greg AI (συνομιλίες, φωτογραφίες, εξατομίκευση)</td>
          <td>Εκτέλεση σύμβασης (παρ. 1β)</td>
        </tr>
        <tr>
          <td>
            Ανασκόπηση συνομιλιών από τον καθηγητή, βελτίωση υλικού, όριο χρήσης
          </td>
          <td>Έννομο συμφέρον (παρ. 1στ)</td>
        </tr>
        <tr>
          <td>Επιβεβαίωση γονέα για χρήστες κάτω των 15</td>
          <td>Συγκατάθεση γονέα (παρ. 1α, άρθρ. 8 GDPR, άρθρ. 21 Ν. 4624/2019)</td>
        </tr>
        <tr>
          <td>Αποστολή newsletter</td>
          <td>Συγκατάθεση (παρ. 1α) — ανακαλείται οποτεδήποτε</td>
        </tr>
        <tr>
          <td>Ασφάλεια, αποτροπή κατάχρησης, audit log</td>
          <td>Έννομο συμφέρον (παρ. 1στ)</td>
        </tr>
        <tr>
          <td>Φορολογικές και λογιστικές υποχρεώσεις</td>
          <td>Νομική υποχρέωση (παρ. 1γ)</td>
        </tr>
        <tr>
          <td>Απάντηση σε ερωτήματα φόρμας επικοινωνίας</td>
          <td>Έννομο συμφέρον / συγκατάθεση</td>
        </tr>
      </tbody>
    </table>

    <h2>4. Αποδέκτες δεδομένων (επεξεργαστές)</h2>
    <p>
      Δεν πουλάμε ποτέ προσωπικά δεδομένα. Συνεργαζόμαστε με τους εξής
      παρόχους ως εκτελούντες την επεξεργασία:
    </p>
    <ul>
      <li>
        <strong>MongoDB Atlas (MongoDB, Inc.):</strong> φιλοξενία βάσης
        δεδομένων.
      </li>
      <li>
        <strong>Vercel Inc.:</strong> φιλοξενία εφαρμογής, Vercel Analytics.
      </li>
      <li>
        <strong>Stripe Payments Europe Ltd.:</strong> διαχείριση πληρωμών
        καρτών.
      </li>
      <li>
        <strong>Cloudinary Ltd.:</strong> φιλοξενία αρχείων (PDF, εικόνες).
      </li>
      <li>
        <strong>Supabase Inc.:</strong> υπηρεσία πραγματικού χρόνου για το chat.
      </li>
      <li>
        <strong>Anthropic PBC:</strong> μοντέλα τεχνητής νοημοσύνης (Claude)
        για το Greg AI. Λαμβάνει τα μηνύματα, τις φωτογραφίες και το απαραίτητο
        πλαίσιο κάθε συνομιλίας· δεν τα χρησιμοποιεί για εκπαίδευση μοντέλων και
        τα διαγράφει εντός 30 ημερών, εκτός αν επισημανθούν για κατάχρηση.
      </li>
      <li>
        <strong>Kit (ConvertKit LLC):</strong> αποστολή newsletter, μόνο για
        όσους εγγραφούν.
      </li>
      <li>
        <strong>Resend, Inc.:</strong> αποστολή email (φόρμα επικοινωνίας,
        αποστολή συνομιλίας στον καθηγητή).
      </li>
      <li>
        <strong>Google LLC:</strong> προαιρετική σύνδεση μέσω Google OAuth,
        προβολή βίντεο YouTube.
      </li>
    </ul>
    <p>
      Ορισμένοι από τους παραπάνω παρόχους ενδέχεται να αποθηκεύουν δεδομένα
      εκτός Ευρωπαϊκού Οικονομικού Χώρου (π.χ. ΗΠΑ). Σε αυτές τις περιπτώσεις
      διασφαλίζονται κατάλληλες εγγυήσεις, όπως οι Τυποποιημένες Συμβατικές
      Ρήτρες (SCCs) της Ευρωπαϊκής Επιτροπής.
    </p>

    <h2>5. Διάρκεια διατήρησης</h2>
    <ul>
      <li>
        <strong>Στοιχεία λογαριασμού:</strong> όσο διατηρείτε ενεργό λογαριασμό.
        Μετά τη διαγραφή, διαγράφονται εντός 30 ημερών — εκτός αν απαιτείται
        διατήρηση από τον νόμο.
      </li>
      <li>
        <strong>Ιστορικό αγορών &amp; παραστατικά:</strong> 5 έτη (φορολογική
        υποχρέωση).
      </li>
      <li>
        <strong>Audit log ασφαλείας:</strong> 12 μήνες.
      </li>
      <li>
        <strong>Μηνύματα φόρμας επικοινωνίας:</strong> 24 μήνες.
      </li>
      <li>
        <strong>Συνομιλίες Greg AI:</strong> μέχρι να τις διαγράψετε από το
        ιστορικό (🕘) ή να διαγράψετε τον λογαριασμό σας. Οι φωτογραφίες δεν
        αποθηκεύονται.
      </li>
      <li>
        <strong>Στοιχεία συγκατάθεσης</strong> (αποδοχή Όρων, email και
        επιβεβαίωση γονέα): όσο υπάρχει ο λογαριασμός.
      </li>
      <li>
        <strong>Newsletter:</strong> μέχρι να απεγγραφείτε (σύνδεσμος σε κάθε
        email).
      </li>
      <li>
        <strong>Δημοσιεύσεις Q&amp;A:</strong> διατηρούνται όσο υπάρχει η
        υπηρεσία (ακόμη και μετά τη διαγραφή λογαριασμού, ανωνυμοποιούνται).
      </li>
    </ul>

    <h2>6. Τα δικαιώματά σας</h2>
    <p>Σύμφωνα με τον GDPR έχετε τα παρακάτω δικαιώματα:</p>
    <ul>
      <li>
        <strong>Πρόσβαση</strong> στα δεδομένα που τηρούμε για εσάς.
      </li>
      <li>
        <strong>Διόρθωση</strong> ανακριβών στοιχείων.
      </li>
      <li>
        <strong>Διαγραφή</strong> («δικαίωμα στη λήθη»), εφόσον δεν υπάρχει
        υπερισχύουσα νομική υποχρέωση διατήρησης.
      </li>
      <li>
        <strong>Περιορισμό</strong> ή <strong>αντίταξη</strong> στην
        επεξεργασία.
      </li>
      <li>
        <strong>Φορητότητα</strong> των δεδομένων (παροχή σε δομημένη μορφή).
      </li>
      <li>
        <strong>Ανάκληση</strong> συγκατάθεσης χωρίς αναδρομικό αποτέλεσμα.
      </li>
      <li>
        <strong>Καταγγελία</strong> στην{" "}
        <a
          href="https://www.dpa.gr"
          target="_blank"
          rel="noopener noreferrer"
        >
          Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα
        </a>{" "}
        (www.dpa.gr).
      </li>
    </ul>
    <p>
      Μπορείτε να κατεβάσετε όλα τα δεδομένα σας ή να διαγράψετε τον
      λογαριασμό σας μόνοι σας από τη σελίδα{" "}
      <Link to="/account">Λογαριασμός</Link>. Για οποιοδήποτε άλλο δικαίωμα
      στείλτε email στο <strong>gregkirmaths@gmail.com</strong>. Απαντάμε εντός
      30 ημερών χωρίς χρέωση.
    </p>

    <h2>7. Ασφάλεια</h2>
    <ul>
      <li>Κρυπτογραφημένη μετάδοση μέσω HTTPS/TLS.</li>
      <li>Hashing κωδικών με bcrypt — οι κωδικοί δεν αποθηκεύονται ποτέ σε καθαρή μορφή.</li>
      <li>CSRF tokens σε όλες τις φόρμες· rate limiting σε ευαίσθητα endpoints.</li>
      <li>Έλεγχοι πρόσβασης και ρόλων (διαχειριστής/χρήστης).</li>
      <li>Καταγραφή κρίσιμων ενεργειών στο audit log.</li>
    </ul>
    <p>
      Σε περίπτωση παραβίασης δεδομένων που ενέχει υψηλό κίνδυνο για τα
      δικαιώματά σας, θα σας ενημερώσουμε εντός 72 ωρών σύμφωνα με το άρθρο 33
      GDPR.
    </p>

    <h2>8. Ανήλικοι</h2>
    <p>
      Η Πλατφόρμα απευθύνεται σε μαθητές Γυμνασίου και Λυκείου. Στην Ελλάδα το
      όριο ηλικίας για τη συγκατάθεση σε ψηφιακές υπηρεσίες είναι τα 15 έτη
      (άρθρ. 21 Ν. 4624/2019).
    </p>
    <ul>
      <li>
        Κατά την εγγραφή ο χρήστης δηλώνει αν είναι κάτω των 15. Αν ναι, δηλώνει
        email γονέα/κηδεμόνα και στέλνουμε σε αυτό σύνδεσμο επιβεβαίωσης.
      </li>
      <li>
        Μέχρι να επιβεβαιώσει ο γονέας, το Greg AI παραμένει κλειδωμένο. Αν ο
        γονέας αρνηθεί, ο λογαριασμός και τα δεδομένα του διαγράφονται αμέσως.
      </li>
      <li>
        Ο γονέας μπορεί οποτεδήποτε να ανακαλέσει τη συγκατάθεση ή να ζητήσει
        πρόσβαση ή διαγραφή των δεδομένων του παιδιού στο{" "}
        <strong>gregkirmaths@gmail.com</strong>.
      </li>
      <li>
        Δεν κάνουμε προφίλ για διαφημιστικούς σκοπούς και δεν δείχνουμε
        διαφημίσεις.
      </li>
    </ul>

    <h2>9. Αλλαγές στην πολιτική</h2>
    <p>
      Ενδέχεται να ενημερώνουμε αυτήν την πολιτική. Ουσιώδεις αλλαγές θα
      ανακοινώνονται μέσω email ή με εμφανή ένδειξη στην πλατφόρμα,
      τουλάχιστον 14 ημέρες πριν τεθούν σε ισχύ.
    </p>

    <h2>10. Επικοινωνία</h2>
    <p>
      Για κάθε ερώτηση σχετικά με τα προσωπικά σας δεδομένα ή την παρούσα
      πολιτική, επικοινωνήστε μαζί μας στο{" "}
      <strong>gregkirmaths@gmail.com</strong> ή μέσω της{" "}
      <Link to="/contact">φόρμας επικοινωνίας</Link>.
    </p>

    <p>
      Δείτε επίσης τους <Link to="/useOfTerms">Όρους Χρήσης</Link>.
    </p>
  </>
);

const EnglishPolicy = () => (
  <>
    <h1>Privacy Policy</h1>

    <p>
      This Privacy Policy describes how <strong>GregKyrMaths</strong>{" "}
      (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, uses and protects your
      personal data when you use the Platform. We respect your privacy and are
      committed to compliance with Regulation (EU) 2016/679 (GDPR) and Greek
      Law 4624/2019.
    </p>

    <div className="not-prose rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-gray-800">
      <p className="font-semibold">In short</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>We keep only what we need to run your account and help you learn.</li>
        <li>
          Greg AI is an artificial intelligence, not the teacher. Your chats are
          saved and Greg, the teacher, may read them.
        </li>
        <li>Photos you send to Greg AI are not stored.</li>
        <li>If you are under 15, we need a parent&rsquo;s approval for Greg AI.</li>
        <li>We never sell your data or use it for advertising.</li>
        <li>
          You can download or delete your data whenever you like from the{" "}
          <Link to="/account">Account</Link> page.
        </li>
      </ul>
    </div>

    <h2>1. Data controller</h2>
    <p>
      The controller of your personal data is Grigoris Kyritsis. Contact:
    </p>
    <ControllerDetails lang="en" />

    <h2>2. What data we collect</h2>
    <h3>2.1 Data you provide</h3>
    <ul>
      <li>
        <strong>Account creation:</strong> first and last name, email address,
        password (stored only as a <em>bcrypt</em> hash — we never see it in
        plain text).
      </li>
      <li>
        <strong>Google sign-in:</strong> if you choose Google OAuth, we
        receive your public Google email and account name.
      </li>
      <li>
        <strong>Communication:</strong> name, email and message when you submit
        the contact form.
      </li>
      <li>
        <strong>User content:</strong> the questions, answers and tags you
        publish in the Q&amp;A community.
      </li>
      <li>
        <strong>Age and consent:</strong> whether you are over or under 15, when
        you accepted the Terms and this Policy and, for users under 15, the
        parent&rsquo;s/guardian&rsquo;s email and when they confirmed.
      </li>
      <li>
        <strong>Newsletter:</strong> your email, only if you subscribe.
      </li>
    </ul>

    <h3>2.2 Data collected automatically</h3>
    <ul>
      <li>
        <strong>Strictly necessary cookies:</strong> <code>gregMaths</code>{" "}
        (login session, 30-day duration), <code>_csrf</code> (form
        protection, 24 hours), <code>i18n</code> (language preference, 1-year
        duration). We use no advertising or tracking cookies, so no cookie
        consent is requested.
      </li>
      <li>
        <strong>Browser local storage:</strong> whether you dismissed the
        policy-update notice, and your sign-in to the community live chat.
      </li>
      <li>
        <strong>YouTube videos:</strong> thumbnails load from Google; the video
        loads in privacy-enhanced mode (youtube-nocookie.com) only when you
        press play.
      </li>
      <li>
        <strong>Technical data:</strong> IP address, browser type, operating
        system, time of visit — for security and error diagnostics.
      </li>
      <li>
        <strong>Audit log:</strong> records of sensitive actions (login,
        purchase, deletion) for security and abuse prevention.
      </li>
      <li>
        <strong>Traffic statistics (Vercel Analytics):</strong> anonymous,
        cookie-less recording of page views, with no cross-site tracking.
      </li>
    </ul>

    <h3>2.3 Purchase data</h3>
    <ul>
      <li>
        Book purchase history, transaction time, Stripe session identifier.
      </li>
      <li>
        We do <strong>not</strong> store credit/debit card details — payment
        is performed directly on Stripe&rsquo;s pages.
      </li>
    </ul>

    <h3>2.4 Greg AI (math tutoring assistant)</h3>
    <p>
      Greg AI is an artificial-intelligence assistant available only to
      logged-in users. When you use it:
    </p>
    <ul>
      <li>
        <strong>We store your conversations</strong> (your messages and Greg
        AI&rsquo;s replies) so you can reopen them from your history.
      </li>
      <li>
        <strong>Photos:</strong> if you send a photo of a problem, it is shrunk
        on your device and sent once to our AI provider with that message.{" "}
        <strong>We do not store it</strong> — only Greg AI&rsquo;s reply is
        saved.
      </li>
      <li>
        <strong>Personalisation:</strong> the grade you select, your first
        name, the exercises you have viewed, your practice scores and the
        topics where you recently needed help, so explanations match your
        level.
      </li>
      <li>
        <strong>Ratings and usage:</strong> the 👍/👎 you give to replies and
        your daily message count (for the usage limit).
      </li>
      <li>
        <strong>Review by the teacher:</strong> Grigoris Kyritsis, as the
        teacher, may read conversations and ratings to improve the learning
        material, spot mistakes by Greg AI and keep the service safe.
        Conversations are never published or shared with third parties.
      </li>
      <li>
        <strong>Sending to the teacher:</strong> a conversation is emailed to
        the teacher <strong>only</strong> if you press &ldquo;Send this
        conversation to Greg&rdquo;.
      </li>
      <li>
        Messages are processed by Anthropic (see section 4), which does not use
        data from our service to train its models and deletes it within 30 days
        (up to 2 years only if a message is flagged for breaking its usage
        rules). Please do not share sensitive personal information with Greg
        AI.
      </li>
      <li>
        Greg AI&rsquo;s replies are generated automatically and may contain
        mistakes. No automated decisions with legal or similarly significant
        effects are made about you (GDPR Art. 22).
      </li>
    </ul>

    <h2>3. Purposes and legal basis</h2>
    <table className="text-sm">
      <thead>
        <tr>
          <th>Purpose</th>
          <th>Legal basis (GDPR Art. 6)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Account creation and management</td>
          <td>Contract performance (1(b))</td>
        </tr>
        <tr>
          <td>Sale and delivery of digital books</td>
          <td>Contract performance (1(b))</td>
        </tr>
        <tr>
          <td>Posting questions/answers in Q&amp;A</td>
          <td>Consent + contract performance</td>
        </tr>
        <tr>
          <td>Providing Greg AI (conversations, photos, personalisation)</td>
          <td>Contract performance (1(b))</td>
        </tr>
        <tr>
          <td>Teacher review of conversations, improving material, usage limit</td>
          <td>Legitimate interest (1(f))</td>
        </tr>
        <tr>
          <td>Parent confirmation for users under 15</td>
          <td>Parental consent (1(a), GDPR Art. 8, Law 4624/2019 Art. 21)</td>
        </tr>
        <tr>
          <td>Sending the newsletter</td>
          <td>Consent (1(a)) — can be withdrawn at any time</td>
        </tr>
        <tr>
          <td>Security, abuse prevention, audit log</td>
          <td>Legitimate interest (1(f))</td>
        </tr>
        <tr>
          <td>Tax and accounting obligations</td>
          <td>Legal obligation (1(c))</td>
        </tr>
        <tr>
          <td>Responding to contact-form messages</td>
          <td>Legitimate interest / consent</td>
        </tr>
      </tbody>
    </table>

    <h2>4. Recipients (data processors)</h2>
    <p>
      We never sell personal data. We work with the following providers as
      processors:
    </p>
    <ul>
      <li>
        <strong>MongoDB Atlas (MongoDB, Inc.):</strong> database hosting.
      </li>
      <li>
        <strong>Vercel Inc.:</strong> application hosting, Vercel Analytics.
      </li>
      <li>
        <strong>Stripe Payments Europe Ltd.:</strong> card payment processing.
      </li>
      <li>
        <strong>Cloudinary Ltd.:</strong> file hosting (PDFs, images).
      </li>
      <li>
        <strong>Supabase Inc.:</strong> real-time service for chat.
      </li>
      <li>
        <strong>Anthropic PBC:</strong> AI models (Claude) that power Greg AI.
        It receives the messages, photos and necessary context of each
        conversation; it does not use them to train models and deletes them
        within 30 days unless they are flagged for abuse.
      </li>
      <li>
        <strong>Kit (ConvertKit LLC):</strong> newsletter delivery, only for
        subscribers.
      </li>
      <li>
        <strong>Resend, Inc.:</strong> email delivery (contact form, sending a
        conversation to the teacher).
      </li>
      <li>
        <strong>Google LLC:</strong> optional Google OAuth sign-in, YouTube
        video playback.
      </li>
    </ul>
    <p>
      Some of the above providers may store data outside the European
      Economic Area (e.g. the United States). In such cases appropriate
      safeguards are in place, including the European Commission&rsquo;s
      Standard Contractual Clauses (SCCs).
    </p>

    <h2>5. Retention</h2>
    <ul>
      <li>
        <strong>Account data:</strong> as long as your account is active.
        After deletion, removed within 30 days — unless retention is required
        by law.
      </li>
      <li>
        <strong>Purchase history &amp; invoices:</strong> 5 years (tax
        obligation).
      </li>
      <li>
        <strong>Security audit log:</strong> 12 months.
      </li>
      <li>
        <strong>Contact-form messages:</strong> 24 months.
      </li>
      <li>
        <strong>Greg AI conversations:</strong> until you delete them from your
        history (🕘) or delete your account. Photos are not stored.
      </li>
      <li>
        <strong>Consent records</strong> (acceptance of the Terms, parent email
        and confirmation): while the account exists.
      </li>
      <li>
        <strong>Newsletter:</strong> until you unsubscribe (link in every
        email).
      </li>
      <li>
        <strong>Q&amp;A posts:</strong> retained while the service exists
        (anonymised after account deletion).
      </li>
    </ul>

    <h2>6. Your rights</h2>
    <p>Under the GDPR you have the following rights:</p>
    <ul>
      <li>
        <strong>Access</strong> the data we hold about you.
      </li>
      <li>
        <strong>Rectification</strong> of inaccurate information.
      </li>
      <li>
        <strong>Erasure</strong> (&ldquo;right to be forgotten&rdquo;), unless
        an overriding legal obligation requires retention.
      </li>
      <li>
        <strong>Restriction</strong> or <strong>objection</strong> to
        processing.
      </li>
      <li>
        <strong>Portability</strong> of data (provision in a structured
        format).
      </li>
      <li>
        <strong>Withdrawal</strong> of consent without retroactive effect.
      </li>
      <li>
        <strong>Complaint</strong> to the{" "}
        <a
          href="https://www.dpa.gr"
          target="_blank"
          rel="noopener noreferrer"
        >
          Hellenic Data Protection Authority
        </a>{" "}
        (www.dpa.gr).
      </li>
    </ul>
    <p>
      You can download all your data or delete your account yourself from the{" "}
      <Link to="/account">Account</Link> page. For any other right, email{" "}
      <strong>gregkirmaths@gmail.com</strong>. We respond within 30 days at no
      charge.
    </p>

    <h2>7. Security</h2>
    <ul>
      <li>Encrypted transmission via HTTPS/TLS.</li>
      <li>Password hashing with bcrypt — passwords are never stored in plain text.</li>
      <li>CSRF tokens on all forms; rate limiting on sensitive endpoints.</li>
      <li>Access and role checks (admin/user).</li>
      <li>Logging of critical actions in the audit log.</li>
    </ul>
    <p>
      In the event of a data breach posing a high risk to your rights, we will
      notify you within 72 hours pursuant to GDPR Article 33.
    </p>

    <h2>8. Minors</h2>
    <p>
      The Platform is aimed at lower and upper secondary school students. In
      Greece the age of consent for digital services is 15 (Law 4624/2019 Art.
      21).
    </p>
    <ul>
      <li>
        At signup users say whether they are under 15. If so, they give a
        parent&rsquo;s/guardian&rsquo;s email and we send a confirmation link
        to it.
      </li>
      <li>
        Greg AI stays locked until the parent confirms. If the parent declines,
        the account and its data are deleted immediately.
      </li>
      <li>
        A parent can withdraw consent or ask for access to or deletion of their
        child&rsquo;s data at any time by emailing{" "}
        <strong>gregkirmaths@gmail.com</strong>.
      </li>
      <li>We do not profile users for advertising and show no ads.</li>
    </ul>

    <h2>9. Changes to the policy</h2>
    <p>
      We may update this policy. Material changes will be announced by email
      or by a clear notice on the platform, at least 14 days before they take
      effect.
    </p>

    <h2>10. Contact</h2>
    <p>
      For any question about your personal data or this policy, contact us at{" "}
      <strong>gregkirmaths@gmail.com</strong> or through the{" "}
      <Link to="/contact">contact form</Link>.
    </p>

    <p>
      See also the <Link to="/useOfTerms">Terms of Use</Link>.
    </p>
  </>
);

export default PrivacyPolicy;
