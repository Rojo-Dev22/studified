const fs = require('fs');

const grades = {
  9: ["Mathematics", "English", "Physics", "Chemistry", "Biology", "Economics", "Amharic", "Citizenship", "History", "Geography", "IT"],
  10: ["Mathematics", "English", "Physics", "Chemistry", "Biology", "Economics", "Amharic", "Citizenship", "History", "Geography", "IT"],
  11: ["Mathematics", "English", "Physics", "Chemistry", "Biology", "Economics", "History", "Geography", "Accounting and Finance", "Marketing", "Computer Maintenance", "IT", "Web Design"],
  12: ["Mathematics", "English", "Physics", "Chemistry", "Biology", "Economics", "Citizenship", "History", "Geography", "Accounting and Finance", "Marketing", "Computer Maintenance", "IT", "Web Design"]
};

const urlMap = {
  "Mathematics": "Math's",
  "IT": "Information Technology"
};

const books = [];
let idCounter = 1;

for (const gradeStr of Object.keys(grades)) {
  const grade = parseInt(gradeStr);
  for (const subject of grades[gradeStr]) {
    const urlSubject = urlMap[subject] || subject;
    const displayTitle = subject === 'IT' ? 'Information Technology' : subject;
    const chunkSubject = subject === 'IT' ? 'ict' : subject.toLowerCase().replace(/\s+/g, '_');
    const language = subject === "Amharic" ? "am" : "en";
    books.push({
      id: `book_${grade}_${idCounter++}`,
      grade,
      subject,
      language,
      title: `${displayTitle} Student Textbook (New Curriculum) Grade ${grade}`,
      url: `https://addisentrancehub.com/books/Grade%20${grade}/New%20Curriculum/Student%20Textbook/${encodeURIComponent(urlSubject)}.pdf`,
      chunksFile: `g${grade}_${chunkSubject}_${language}.json`,
      keywords: [subject.toLowerCase(), "grade", grade.toString(), displayTitle.toLowerCase()]
    });
  }
}

fs.writeFileSync('public/textbooks/manifest.json', JSON.stringify({ generatedAt: new Date().toISOString(), books }, null, 2));
console.log('Manifest updated with exact books!');
