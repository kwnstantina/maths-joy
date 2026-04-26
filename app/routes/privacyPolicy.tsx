import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";

export const handle = { i18n: ["common"] };

export const meta: MetaFunction = () => [
  { title: "Πολιτική Απορρήτου | GregKyrMaths" },
  {
    name: "description",
    content:
      "Πολιτική Απορρήτου σύμφωνα με τον GDPR — ποια δεδομένα συλλέγουμε, πώς τα χρησιμοποιούμε και τα δικαιώματά σας.",
  },
];

const LAST_UPDATED = "2026-04-25";

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

    <h2>1. Υπεύθυνος επεξεργασίας</h2>
    <p>
      Υπεύθυνος επεξεργασίας των δεδομένων σας είναι ο Γρηγόρης Κυρίτσης.
      Στοιχεία επικοινωνίας:
    </p>
    <ul>
      <li>Email: gregkirmaths@gmail.com</li>
      <li>Τηλέφωνο: +30 6987495775</li>
    </ul>

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
    </ul>

    <h3>2.2 Δεδομένα που συλλέγονται αυτόματα</h3>
    <ul>
      <li>
        <strong>Cookies απαραίτητα για τη λειτουργία:</strong>{" "}
        <code>gregMaths</code> (συνεδρία σύνδεσης, διάρκεια 30 ημερών),{" "}
        <code>i18n</code> (επιλογή γλώσσας, διάρκεια 1 έτος).
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
        <strong>Google LLC:</strong> προαιρετική σύνδεση μέσω Google OAuth.
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
      Για άσκηση οποιουδήποτε από τα παραπάνω δικαιώματα στείλτε email στο{" "}
      <strong>gregkirmaths@gmail.com</strong>. Απαντάμε εντός 30 ημερών χωρίς
      χρέωση.
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
      Η Πλατφόρμα δεν απευθύνεται σε παιδιά κάτω των 16 ετών. Εάν είστε γονέας
      ή κηδεμόνας και διαπιστώσετε ότι το παιδί σας έχει παράσχει δεδομένα
      χωρίς συναίνεση, επικοινωνήστε άμεσα μαζί μας για διαγραφή.
    </p>

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

    <h2>1. Data controller</h2>
    <p>
      The controller of your personal data is Grigoris Kyritsis. Contact:
    </p>
    <ul>
      <li>Email: gregkirmaths@gmail.com</li>
      <li>Phone: +30 6987495775</li>
    </ul>

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
    </ul>

    <h3>2.2 Data collected automatically</h3>
    <ul>
      <li>
        <strong>Strictly necessary cookies:</strong> <code>gregMaths</code>{" "}
        (login session, 30-day duration), <code>i18n</code> (language
        preference, 1-year duration).
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
        <strong>Google LLC:</strong> optional Google OAuth sign-in.
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
      To exercise any of the above, email{" "}
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
      The Platform is not intended for children under 16. If you are a parent
      or guardian and find that your child has provided data without consent,
      please contact us immediately for deletion.
    </p>

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
