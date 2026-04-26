import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";

export const handle = { i18n: ["common"] };

export const meta: MetaFunction = () => [
  { title: "Όροι Χρήσης | GregKyrMaths" },
  {
    name: "description",
    content:
      "Όροι χρήσης της πλατφόρμας GregKyrMaths για ασκήσεις, βιβλία και την κοινότητα Ερωτήσεων & Απαντήσεων.",
  },
];

const LAST_UPDATED = "2026-04-25";

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

const GreekTerms = () => (
  <>
    <h1>Όροι Χρήσης</h1>

    <p>
      Καλώς ήρθατε στο <strong>GregKyrMaths</strong>. Οι παρόντες Όροι Χρήσης
      («Όροι») διέπουν τη χρήση της ιστοσελίδας και όλων των υπηρεσιών που
      παρέχονται μέσω αυτής (η «Πλατφόρμα»). Με την πρόσβαση ή τη χρήση της
      Πλατφόρμας, αποδέχεστε ανεπιφύλακτα τους Όρους. Εάν δεν συμφωνείτε με
      οποιονδήποτε όρο, οφείλετε να μην χρησιμοποιείτε την Πλατφόρμα.
    </p>

    <h2>1. Πάροχος υπηρεσίας</h2>
    <p>
      Η Πλατφόρμα λειτουργεί από τον/την Γρηγόρη Κυρίτση (στο εξής «εμείς», «μας»
      ή «Πάροχος»). Στοιχεία επικοινωνίας:
    </p>
    <ul>
      <li>Email: gregkirmaths@gmail.com</li>
      <li>Τηλέφωνο: +30 6987495775</li>
    </ul>

    <h2>2. Περιγραφή υπηρεσιών</h2>
    <p>Η Πλατφόρμα προσφέρει:</p>
    <ul>
      <li>Δωρεάν πρόσβαση σε μαθηματικές ασκήσεις (PDF) και υλικό εξάσκησης.</li>
      <li>
        Πώληση ψηφιακών βιβλίων μαθηματικών μέσω ασφαλούς πληρωμής με κάρτα.
      </li>
      <li>
        Δωρεάν κοινότητα Ερωτήσεων &amp; Απαντήσεων (Q&amp;A) για χρήστες με
        λογαριασμό.
      </li>
      <li>Βίντεο-μαθήματα και υποστηρικτικό εκπαιδευτικό περιεχόμενο.</li>
    </ul>

    <h2>3. Λογαριασμός χρήστη</h2>
    <p>
      Για να χρησιμοποιήσετε ορισμένες λειτουργίες (π.χ. αγορά βιβλίου, υποβολή
      ερώτησης, δημοσίευση απάντησης) απαιτείται δημιουργία λογαριασμού. Ο
      χρήστης δηλώνει ότι:
    </p>
    <ul>
      <li>Είναι 16 ετών και άνω, ή έχει συναίνεση γονέα/κηδεμόνα.</li>
      <li>
        Παρέχει αληθή και ακριβή στοιχεία και τα διατηρεί ενημερωμένα.
      </li>
      <li>
        Είναι αποκλειστικά υπεύθυνος για τη φύλαξη του κωδικού του και για κάθε
        δραστηριότητα που λαμβάνει χώρα μέσω του λογαριασμού του.
      </li>
    </ul>
    <p>
      Διατηρούμε το δικαίωμα αναστολής ή διαγραφής λογαριασμών που παραβιάζουν
      τους παρόντες Όρους.
    </p>

    <h2>4. Πληρωμές, παραδόσεις και υπαναχώρηση</h2>
    <p>
      Οι πληρωμές για τα ψηφιακά βιβλία διεκπεραιώνονται μέσω του παρόχου{" "}
      <strong>Stripe</strong>. Δεν αποθηκεύουμε εμείς στοιχεία κάρτας. Οι τιμές
      εμφανίζονται σε ευρώ (€) και συμπεριλαμβάνουν τυχόν αναλογούν ΦΠΑ.
    </p>
    <p>
      Μετά την επιτυχή ολοκλήρωση της παραγγελίας, αποστέλλεται ηλεκτρονικός
      σύνδεσμος λήψης του βιβλίου στη διεύθυνση email του λογαριασμού.
    </p>
    <p>
      <strong>Υπαναχώρηση:</strong> Σύμφωνα με το άρθρο 3κβ παρ. 13 του Ν.
      2251/1994 (όπως τροποποιήθηκε για ψηφιακό περιεχόμενο), το δικαίωμα
      υπαναχώρησης δεν εφαρμόζεται μετά την εκτέλεση της λήψης ψηφιακού
      περιεχομένου, εφόσον ο καταναλωτής έχει δώσει ρητή προηγούμενη συγκατάθεση
      για την έναρξη εκτέλεσης πριν από τη λήξη της προθεσμίας υπαναχώρησης. Σε
      περίπτωση τεχνικού σφάλματος ή αδυναμίας λήψης, παρακαλούμε επικοινωνήστε
      μαζί μας εντός 14 ημερών για επαναποστολή ή επιστροφή χρημάτων.
    </p>

    <h2>5. Πνευματικά δικαιώματα</h2>
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

    <h2>6. Περιεχόμενο χρήστη (Q&amp;A)</h2>
    <p>
      Οι χρήστες μπορούν να υποβάλλουν ερωτήσεις, απαντήσεις, σχόλια και ετικέτες
      («Περιεχόμενο Χρήστη»). Δημοσιεύοντας Περιεχόμενο Χρήστη:
    </p>
    <ul>
      <li>Διατηρείτε την κυριότητά του.</li>
      <li>
        Παραχωρείτε στον Πάροχο μη αποκλειστική, παγκόσμια, χωρίς δικαιώματα,
        άδεια προβολής, αναπαραγωγής, αρχειοθέτησης και τροποποίησης του
        περιεχομένου εντός της Πλατφόρμας.
      </li>
      <li>
        Δηλώνετε ότι το περιεχόμενο είναι δικό σας και δεν παραβιάζει
        δικαιώματα τρίτων.
      </li>
    </ul>
    <p>
      Διατηρούμε το δικαίωμα να αφαιρέσουμε ή να επεξεργαστούμε Περιεχόμενο
      Χρήστη που παραβιάζει τους Όρους ή την κείμενη νομοθεσία.
    </p>

    <h2>7. Απαγορευμένη χρήση</h2>
    <p>Δεσμεύεστε να μη χρησιμοποιείτε την Πλατφόρμα για:</p>
    <ul>
      <li>Παράνομες, υβριστικές, διακριτικές ή προσβλητικές αναρτήσεις.</li>
      <li>
        Spam, φαρμακευτική ή εμπορική προώθηση χωρίς γραπτή έγκριση.
      </li>
      <li>
        Παράκαμψη μηχανισμών ασφαλείας, scraping ή αυτοματοποιημένα αιτήματα
        πέραν εύλογου ορίου.
      </li>
      <li>
        Αντιγραφή ή μεταπώληση του εκπαιδευτικού περιεχομένου.
      </li>
      <li>
        Πλαστοπροσωπία άλλου χρήστη, εκπαιδευτικού ή του Παρόχου.
      </li>
    </ul>

    <h2>8. Διαθεσιμότητα και αλλαγές</h2>
    <p>
      Καταβάλλουμε εύλογη προσπάθεια ώστε η Πλατφόρμα να είναι διαθέσιμη
      24/7, χωρίς όμως να εγγυώμαστε αδιάλειπτη λειτουργία. Διατηρούμε το
      δικαίωμα προσωρινής διακοπής για συντήρηση, αναβάθμιση ή για λόγους
      ασφάλειας. Διατηρούμε επίσης το δικαίωμα να τροποποιούμε ή να
      διακόπτουμε τμήματα ή το σύνολο της υπηρεσίας.
    </p>

    <h2>9. Αποποίηση ευθύνης</h2>
    <p>
      Η Πλατφόρμα και το εκπαιδευτικό υλικό παρέχονται «ως έχουν». Παρόλο που
      καταβάλλεται κάθε εύλογη προσπάθεια για την ορθότητα του περιεχομένου,
      δεν εγγυώμαστε ότι είναι απαλλαγμένο από λάθη ή ότι θα οδηγήσει σε
      συγκεκριμένα μαθησιακά αποτελέσματα. Στο μέγιστο επιτρεπόμενο από τον
      νόμο βαθμό, η ευθύνη μας περιορίζεται στο ποσό που έχει καταβάλει ο
      χρήστης για την υπηρεσία τους τελευταίους 12 μήνες.
    </p>

    <h2>10. Τροποποίηση Όρων</h2>
    <p>
      Διατηρούμε το δικαίωμα να τροποποιούμε τους παρόντες Όρους. Ουσιώδεις
      αλλαγές θα ανακοινώνονται μέσω της Πλατφόρμας και/ή με email. Η συνεχής
      χρήση μετά τη δημοσίευση των τροποποιήσεων συνιστά αποδοχή τους.
    </p>

    <h2>11. Εφαρμοστέο δίκαιο και δικαιοδοσία</h2>
    <p>
      Οι Όροι διέπονται από το ελληνικό δίκαιο. Για κάθε διαφορά αρμόδια είναι
      τα δικαστήρια της πόλης όπου εδρεύει ο Πάροχος. Πριν από οποιαδήποτε
      δικαστική ενέργεια, οι χρήστες ενθαρρύνονται να επικοινωνήσουν μαζί μας
      για φιλικό διακανονισμό μέσω της σελίδας <Link to="/contact">Επικοινωνία</Link>.
    </p>

    <h2>12. Επικοινωνία</h2>
    <p>
      Για ερωτήσεις σχετικά με τους παρόντες Όρους ή για άσκηση δικαιωμάτων
      σας, επικοινωνήστε στο email <strong>gregkirmaths@gmail.com</strong> ή
      μέσω της <Link to="/contact">φόρμας επικοινωνίας</Link>.
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
      provided through it (the &ldquo;Platform&rdquo;). By accessing or using
      the Platform, you accept these Terms in full. If you disagree with any
      part of the Terms, you must not use the Platform.
    </p>

    <h2>1. Service provider</h2>
    <p>
      The Platform is operated by Grigoris Kyritsis (&ldquo;we&rdquo;,
      &ldquo;us&rdquo; or the &ldquo;Provider&rdquo;). Contact:
    </p>
    <ul>
      <li>Email: gregkirmaths@gmail.com</li>
      <li>Phone: +30 6987495775</li>
    </ul>

    <h2>2. Description of services</h2>
    <p>The Platform offers:</p>
    <ul>
      <li>Free access to mathematics exercises (PDF) and practice material.</li>
      <li>Sale of digital mathematics books via secure card payment.</li>
      <li>A free Q&amp;A community for registered users.</li>
      <li>Video lessons and supporting educational content.</li>
    </ul>

    <h2>3. User account</h2>
    <p>
      Some features (purchasing a book, posting a question or answer) require
      an account. By creating one, you confirm that:
    </p>
    <ul>
      <li>
        You are at least 16 years old, or you have parental/guardian consent.
      </li>
      <li>The information you provide is accurate and kept up to date.</li>
      <li>
        You are solely responsible for safeguarding your password and for any
        activity under your account.
      </li>
    </ul>
    <p>
      We reserve the right to suspend or terminate accounts that violate these
      Terms.
    </p>

    <h2>4. Payments, delivery and withdrawal</h2>
    <p>
      Payments for digital books are processed by <strong>Stripe</strong>. We
      do not store your card details ourselves. Prices are shown in euros (€)
      and include any applicable VAT.
    </p>
    <p>
      After successful checkout, a download link is sent to the email address
      associated with your account.
    </p>
    <p>
      <strong>Right of withdrawal:</strong> Under Greek consumer law (Law
      2251/1994 as amended for digital content), the right of withdrawal does
      not apply once download of the digital content has begun, provided you
      have given prior express consent to start performance before the
      withdrawal period expires. In the event of a technical issue or
      inability to download, please contact us within 14 days for a re-send or
      refund.
    </p>

    <h2>5. Intellectual property</h2>
    <p>
      All educational content on the Platform (exercises, books, video
      lessons, images, logos, copy) is the intellectual property of the
      Provider or the respective rights holders, protected by Greek and
      international law. You are granted a non-exclusive, non-transferable
      license for personal, non-commercial educational use.
    </p>
    <p>The following are expressly prohibited:</p>
    <ul>
      <li>Reproducing, distributing or reselling the content to third parties.</li>
      <li>
        Uploading purchased books or PDFs to public or private platforms.
      </li>
      <li>
        Using the content to train artificial intelligence models without our
        written permission.
      </li>
    </ul>

    <h2>6. User-generated content (Q&amp;A)</h2>
    <p>
      Users may post questions, answers, comments and tags (&ldquo;User
      Content&rdquo;). By posting User Content:
    </p>
    <ul>
      <li>You retain ownership of it.</li>
      <li>
        You grant the Provider a non-exclusive, worldwide, royalty-free
        license to display, reproduce, archive and modify the content within
        the Platform.
      </li>
      <li>
        You confirm that the content is yours and does not infringe the rights
        of any third party.
      </li>
    </ul>
    <p>
      We reserve the right to remove or edit User Content that violates these
      Terms or applicable law.
    </p>

    <h2>7. Prohibited use</h2>
    <p>You agree not to use the Platform for:</p>
    <ul>
      <li>Illegal, abusive, discriminatory or offensive postings.</li>
      <li>Spam, pharmaceutical or commercial promotion without written approval.</li>
      <li>
        Bypassing security mechanisms, scraping or automated requests beyond a
        reasonable limit.
      </li>
      <li>Copying or reselling educational content.</li>
      <li>Impersonating any other user, teacher or the Provider.</li>
    </ul>

    <h2>8. Availability and changes</h2>
    <p>
      We make reasonable efforts to keep the Platform available 24/7, but do
      not guarantee uninterrupted operation. We reserve the right to
      temporarily suspend service for maintenance, upgrades or security. We
      also reserve the right to modify or discontinue parts or all of the
      service.
    </p>

    <h2>9. Disclaimer of warranties</h2>
    <p>
      The Platform and educational material are provided &ldquo;as is&rdquo;.
      While every reasonable effort is made to ensure accuracy, we do not
      warrant that the content is error-free or that it will produce specific
      learning outcomes. To the maximum extent permitted by law, our
      liability is limited to the amount the user has paid for the service in
      the past 12 months.
    </p>

    <h2>10. Modifications to Terms</h2>
    <p>
      We reserve the right to modify these Terms. Material changes will be
      announced through the Platform and/or by email. Continued use after
      publication of changes constitutes acceptance.
    </p>

    <h2>11. Governing law and jurisdiction</h2>
    <p>
      These Terms are governed by the laws of Greece. Any dispute is subject
      to the courts of the city in which the Provider is based. Before any
      legal action, users are encouraged to contact us for an amicable
      resolution via the <Link to="/contact">Contact</Link> page.
    </p>

    <h2>12. Contact</h2>
    <p>
      For questions about these Terms or to exercise your rights, contact{" "}
      <strong>gregkirmaths@gmail.com</strong> or use the{" "}
      <Link to="/contact">contact form</Link>.
    </p>

    <p>
      See also the <Link to="/privacyPolicy">Privacy Policy</Link> for how we
      process your personal data.
    </p>
  </>
);

export default UseOfTerms;
