const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('public/textbooks/manifest.json'));
manifest.books = manifest.books.map(b => {
  if (!b.title.includes('New Curriculum')) {
    b.title = b.title.replace('Textbook', 'Textbook (New Curriculum)');
  }
  let sub = b.subject;
  if (sub.includes('Civics')) sub = 'Citizenship';
  if (sub === 'ICT') sub = 'Information Technology';
  b.url = `https://addisentrancehub.com/books/Grade%20${b.grade}/New%20Curriculum/Student%20Textbook/${encodeURIComponent(sub)}.pdf`;
  return b;
});
fs.writeFileSync('public/textbooks/manifest.json', JSON.stringify(manifest, null, 2));
console.log('Manifest updated!');
