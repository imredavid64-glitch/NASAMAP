import challengesRaw from './src/data/challenges-2026.json';
import { matchLanes, servedCount, coveragePct, annotateChallenges } from './src/lib/challenges';

const matches = annotateChallenges(challengesRaw.challenges);
console.log('Total challenges:', matches.length);
console.log('Served:', servedCount(matches));
console.log('Coverage:', coveragePct(matches).toFixed(1) + '%');
console.log('');

matches.filter(m => m.score > 0).forEach(m => {
  console.log('  ✓', m.title, '->', m.lanes.join(', '));
});

matches.filter(m => m.score === 0).forEach(m => {
  console.log('  ✗', m.title);
});