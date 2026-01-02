import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Seed Books
  await seedBooks();

  // Seed Questions and Answers
  await seedQA();

  console.log("Seed completed!");
}

async function seedBooks() {
  console.log("Seeding books...");

  const books = [
    {
      title: "Μαθηματικά Γ' Λυκείου - Ανάλυση",
      description:
        "Πλήρης οδηγός για την Ανάλυση της Γ' Λυκείου. Περιλαμβάνει θεωρία, λυμένες ασκήσεις και θέματα εξετάσεων. Καλύπτει παραγώγους, ολοκληρώματα, διαφορικές εξισώσεις και εφαρμογές.",
      price: 15.99,
      currency: "EUR",
      category: "highschool",
      tags: ["calculus", "derivatives", "integrals", "lyceum"],
      cloudinaryPublicId: "books/math-analysis",
      cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/sample.pdf",
      thumbnailUrl: null,
      isActive: true,
      translation: {
        en: {
          title: "Mathematics Grade 12 - Calculus",
          description:
            "Complete guide for Grade 12 Calculus. Includes theory, solved exercises and exam topics. Covers derivatives, integrals, differential equations and applications.",
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      title: "Άλγεβρα Β' Λυκείου",
      description:
        "Αναλυτική παρουσίαση της Άλγεβρας Β' Λυκείου. Πολυώνυμα, εξισώσεις, ανισώσεις, συναρτήσεις. Με πολλές λυμένες ασκήσεις και τεστ αυτοαξιολόγησης.",
      price: 12.99,
      currency: "EUR",
      category: "highschool",
      tags: ["algebra", "polynomials", "equations", "lyceum"],
      cloudinaryPublicId: "books/algebra-b",
      cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/sample.pdf",
      thumbnailUrl: null,
      isActive: true,
      translation: {
        en: {
          title: "Algebra Grade 11",
          description:
            "Detailed presentation of Grade 11 Algebra. Polynomials, equations, inequalities, functions. With many solved exercises and self-assessment tests.",
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      title: "Γεωμετρία Α' Λυκείου",
      description:
        "Βασικές έννοιες Ευκλείδειας Γεωμετρίας. Τρίγωνα, τετράπλευρα, κύκλος, εμβαδά. Θεωρήματα και αποδείξεις με σαφή βήματα.",
      price: 10.99,
      currency: "EUR",
      category: "highschool",
      tags: ["geometry", "triangles", "circles", "lyceum"],
      cloudinaryPublicId: "books/geometry-a",
      cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/sample.pdf",
      thumbnailUrl: null,
      isActive: true,
      translation: {
        en: {
          title: "Geometry Grade 10",
          description:
            "Basic concepts of Euclidean Geometry. Triangles, quadrilaterals, circles, areas. Theorems and proofs with clear steps.",
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      title: "Τριγωνομετρία",
      description:
        "Πλήρης οδηγός τριγωνομετρίας. Τριγωνομετρικές συναρτήσεις, ταυτότητες, εξισώσεις. Κατάλληλο για Β' και Γ' Λυκείου.",
      price: 8.99,
      currency: "EUR",
      category: "highschool",
      tags: ["trigonometry", "functions", "identities"],
      cloudinaryPublicId: "books/trigonometry",
      cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/sample.pdf",
      thumbnailUrl: null,
      isActive: true,
      translation: {
        en: {
          title: "Trigonometry",
          description:
            "Complete trigonometry guide. Trigonometric functions, identities, equations. Suitable for Grades 11 and 12.",
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      title: "Μαθηματικά Γυμνασίου - Συλλογή Ασκήσεων",
      description:
        "Συλλογή ασκήσεων για όλες τις τάξεις του Γυμνασίου. Αριθμητική, άλγεβρα, γεωμετρία. Ιδανικό για επανάληψη και εξάσκηση.",
      price: 9.99,
      currency: "EUR",
      category: "gymnasium",
      tags: ["arithmetic", "algebra", "geometry", "gymnasium"],
      cloudinaryPublicId: "books/math-gymnasium",
      cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/sample.pdf",
      thumbnailUrl: null,
      isActive: true,
      translation: {
        en: {
          title: "Middle School Mathematics - Exercise Collection",
          description:
            "Exercise collection for all middle school grades. Arithmetic, algebra, geometry. Ideal for review and practice.",
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const book of books) {
    const existing = await prisma.book.findFirst({
      where: { title: book.title },
    });

    if (!existing) {
      await prisma.book.create({ data: book });
      console.log(`  Created book: ${book.title}`);
    } else {
      console.log(`  Book already exists: ${book.title}`);
    }
  }
}

async function seedQA() {
  console.log("Seeding Q&A...");

  // First, we need a user ID for the author
  // Using a placeholder ObjectId - in production this would be a real user
  const authorId = "000000000000000000000001";
  const authorName = "Demo User";

  const questions = [
    {
      title: "Πώς υπολογίζω την παράγωγο του e^x;",
      body: "Δεν καταλαβαίνω πώς να υπολογίσω την παράγωγο της συνάρτησης f(x) = e^x. Μπορεί κάποιος να μου εξηγήσει βήμα-βήμα;",
      category: "Calculus",
      tags: ["derivatives", "exponential", "calculus"],
      authorId,
      authorName,
      voteCount: 5,
      answerCount: 2,
      viewCount: 45,
      isResolved: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
    {
      title: "Τι είναι το Πυθαγόρειο Θεώρημα;",
      body: "Ψάχνω μια απλή εξήγηση του Πυθαγόρειου Θεωρήματος με παραδείγματα εφαρμογής.",
      category: "Geometry",
      tags: ["pythagorean", "theorem", "triangles"],
      authorId,
      authorName,
      voteCount: 12,
      answerCount: 3,
      viewCount: 120,
      isResolved: true,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
    {
      title: "Πώς λύνω εξισώσεις 2ου βαθμού;",
      body: "Έχω πρόβλημα με τις εξισώσεις 2ου βαθμού. Πότε χρησιμοποιώ τη διακρίνουσα και πότε την παραγοντοποίηση;",
      category: "Algebra",
      tags: ["equations", "quadratic", "discriminant"],
      authorId,
      authorName,
      voteCount: 8,
      answerCount: 1,
      viewCount: 78,
      isResolved: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
    {
      title: "Εξήγηση ημίτονου και συνημίτονου",
      body: "Μπερδεύομαι με το ημίτονο και το συνημίτονο. Ποια είναι η διαφορά τους και πότε τα χρησιμοποιούμε;",
      category: "Trigonometry",
      tags: ["sine", "cosine", "trigonometry"],
      authorId,
      authorName,
      voteCount: 6,
      answerCount: 2,
      viewCount: 55,
      isResolved: true,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
    {
      title: "Υπολογισμός ορίων",
      body: "Πώς υπολογίζω το όριο μιας συνάρτησης όταν τείνει στο άπειρο; Υπάρχουν κάποιοι κανόνες;",
      category: "Calculus",
      tags: ["limits", "infinity", "calculus"],
      authorId,
      authorName,
      voteCount: 4,
      answerCount: 1,
      viewCount: 34,
      isResolved: false,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
  ];

  for (const question of questions) {
    const existing = await prisma.question.findFirst({
      where: { title: question.title },
    });

    if (!existing) {
      const created = await prisma.question.create({ data: question });
      console.log(`  Created question: ${question.title}`);

      // Add sample answers
      await seedAnswersForQuestion(created.id, authorId, authorName);
    } else {
      console.log(`  Question already exists: ${question.title}`);
    }
  }
}

async function seedAnswersForQuestion(
  questionId: string,
  authorId: string,
  authorName: string
) {
  const answers = [
    {
      questionId,
      body: "Εξαιρετική ερώτηση! Η απάντηση είναι ότι η παράγωγος του e^x είναι το ίδιο το e^x. Αυτό είναι μια μοναδική ιδιότητα της εκθετικής συνάρτησης με βάση το e.",
      authorId,
      authorName: "Math Teacher",
      voteCount: 3,
      isAccepted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const answer of answers) {
    await prisma.answer.create({ data: answer });
  }
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
