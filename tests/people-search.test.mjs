import assert from 'node:assert/strict';
import test from 'node:test';
import {searchBurials, searchPeople} from '../lib/people-search.ts';

const person=(id,name)=>({id,name,birthDate:'1940-04-03'});
const people=[person('ada','Ada M. Example'),person('sam','Sam Example Jr.'),person('anne','Anne Other'),person('accent','José O’Neal')];

test('one-word searches match first names and surnames, including names with suffixes',()=>{
 assert.deepEqual(searchPeople(people,'Ada').matches.map(p=>p.id),['ada']);
 assert.deepEqual(new Set(searchPeople(people,'Example').matches.map(p=>p.id)),new Set(['ada','sam']));
 assert.deepEqual(searchPeople(people,'Sam').matches.map(p=>p.id),['sam']);
});
test('full names can omit middle initials and tolerate misspellings',()=>{
 assert.deepEqual(searchPeople(people,'Ada Example').matches.map(p=>p.id),['ada']);
 const result=searchPeople(people,'Ada Exampel');
 assert.equal(result.matches[0].id,'ada');assert.equal(result.fuzzy,true);
});
test('name matching normalizes accents, case, whitespace and punctuation',()=>{
 assert.equal(searchPeople(people,'JOSE O NEAL').matches[0].id,'accent');
 assert.equal(searchPeople(people,'  ADA   EXAMPLE ').matches[0].id,'ada');
});
test('unrelated searches stay empty and responses contain only matched people',()=>{
 assert.equal(searchPeople(people,'ZZZZZZ').matches.length,0);
 assert.deepEqual(searchPeople([],'Example').matches,[]);
 const result=searchPeople(people,'Ada');
 assert.deepEqual(Object.keys(result.matches[0]).sort(),['birthDate','id','name']);
});
test('large family searches return at most 100 results',()=>{
 const relatives=Array.from({length:120},(_,i)=>person(String(i),`Relative ${i} Example`));
 assert.equal(searchPeople(relatives,'Example').matches.length,100);
});

test('burial search can fall back to a clearly identified surname match', () => {
 const john = person('john', 'John Russell Jr.');
 const herman = person('herman', 'Herman Russell');
 const unrelated = person('other', 'Russell Example');
 assert.deepEqual(searchBurials([john, unrelated], 'Herman Russell'), { matches: [john], surname: 'russell' });
 assert.deepEqual(searchBurials([john, herman, unrelated], 'Herman Russell'), { matches: [herman] });
});
