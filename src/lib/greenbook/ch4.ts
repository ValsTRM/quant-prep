import type { GbSection } from "./types";

/* ---------------------------------------------------------------------------
 * Chapter 4 — Probability Theory.
 *
 * Original teaching content. Section and problem titles plus page numbers index
 * your own copy of the book; nothing here reproduces its text. The standard
 * results (Bayes, gambler's ruin, order statistics of uniforms) are stated in our
 * own words, and every practice problem and worked example uses our own numbers.
 * ------------------------------------------------------------------------- */

export const CH4_SECTIONS: GbSection[] = [
  /* ------------------------------------------------------------------ 4.1 */
  {
    slug: "4.1-basic-probability-and-set-operations",
    chapter: 4,
    number: "4.1",
    title: "Basic Probability Definitions and Set Operations",
    pages: [59, 63],
    topic: "probability",
    summary:
      "Sample spaces, the three axioms, and the set algebra that turns an awkward question into a countable one.",
    concept: [
      "A probability model is three things: the set of outcomes that could happen (the sample space), the events you care about (subsets of it), and a rule assigning each event a number in [0,1] that sums to 1 across all outcomes. Almost every interview mistake at this level comes from writing down the wrong sample space, not from arithmetic.",
      "The single most useful habit is to make outcomes equally likely, even when the question doesn't. Two dice have 36 equally likely ordered pairs, not 11 equally likely sums. Once outcomes are equally likely, probability is counting: favourable ÷ total. If a question resists that, ask what you'd have to distinguish to make it work — usually it's order, or which die is which.",
      "Two set identities do most of the heavy lifting. Inclusion–exclusion, P(A ∪ B) = P(A) + P(B) − P(A ∩ B), stops you double-counting the overlap. The complement, P(A) = 1 − P(not A), is the one to reach for whenever a question says 'at least one' — the complement of 'at least one' is 'none', which is a single product instead of a sum over cases.",
      "When you have several events, De Morgan's laws let you swap between them: 'none of them' is the complement of 'at least one of them', and 'not all of them' is the complement of 'all of them'. Being fluent at flipping between these four phrasings is worth more than memorising formulas.",
    ],
    keyIdeas: [
      {
        name: "Equally likely outcomes",
        body: "Choose a sample space in which every outcome has the same probability, then count. Distinguish the dice, distinguish the order, label the people — whatever it takes.",
      },
      {
        name: "Inclusion–exclusion",
        body: "P(A ∪ B) = P(A) + P(B) − P(A ∩ B). For three events, add the singles, subtract the pairs, add the triple back.",
      },
      {
        name: "Complement first",
        body: "'At least one' is nearly always easier as 1 − P(none). P(at least one six in n rolls) = 1 − (5/6)ⁿ.",
      },
      {
        name: "Mutually exclusive ≠ independent",
        body: "Mutually exclusive events can't co-occur, so they are maximally dependent: knowing one happened tells you the other didn't. Independent events satisfy P(A ∩ B) = P(A)P(B).",
      },
    ],
    checkYourself: [
      "Why is P(sum of two dice = 7) equal to 1/6 rather than 1/11?",
      "State inclusion–exclusion for three events, and say what each term corrects for.",
      "Give two events that are mutually exclusive but not independent, and explain why they can't be both (unless one has probability zero).",
    ],
    examples: [
      {
        id: "4.1-ex1",
        prompt:
          "Two fair dice are rolled. What is the probability that the sum is 7 OR at least one die shows a 3?",
        steps: [
          "Work in the 36 equally likely ordered pairs. This is an 'or', so inclusion–exclusion applies: P(A) + P(B) − P(A ∩ B).",
          "A = 'sum is 7'. The pairs are (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) — 6 of 36.",
          "B = 'at least one 3'. Complement: neither die is a 3, which is 5 × 5 = 25 pairs. So B has 36 − 25 = 11 of 36.",
          "A ∩ B = 'sum is 7 and at least one 3' = (3,4) and (4,3) — 2 of 36. Don't forget both orders.",
          "P = 6/36 + 11/36 − 2/36 = 15/36 = 5/12 ≈ 0.4167.",
        ],
        answer: "5/12 ≈ 0.4167",
        takeaway:
          "Two techniques in one problem: the complement for the 'at least one' leg, inclusion–exclusion to combine. Reaching for 'at least one 3 = 11/36' directly by listing is where people miscount.",
      },
    ],
    problems: [
      {
        id: "4.1-p1",
        prompt:
          "You draw one card from a standard 52-card deck. What is P(it is a heart or a face card)? (Decimal, 4 dp.)",
        answer: "0.4231",
        answerValue: 0.4231,
        tolerance: 0.005,
        gradingType: "numeric_tolerance",
        difficulty: 2,
        targetSeconds: 25,
        explanation:
          "13 hearts + 12 face cards − 3 cards that are both (J, Q, K of hearts) = 22 of 52 = 11/26 ≈ 0.4231. The subtraction is the whole problem.",
        hints: [
          { level: 1, text: "It's an 'or', so the two counts overlap. What's in both sets?" },
          { level: 2, text: "There are 13 hearts and 12 face cards. How many cards are a heart AND a face card?" },
          { level: 3, text: "Inclusion–exclusion: (13 + 12 − 3)/52." },
        ],
      },
      {
        id: "4.1-p2",
        prompt: "You roll a fair die four times. What is P(at least one six)? (Decimal, 4 dp.)",
        answer: "0.5177",
        answerValue: 0.5177,
        tolerance: 0.005,
        gradingType: "numeric_tolerance",
        difficulty: 2,
        targetSeconds: 30,
        explanation:
          "Complement: P(no six) = (5/6)⁴ = 625/1296 ≈ 0.4823, so P(at least one) = 671/1296 ≈ 0.5177. Note it is just over a half — a useful anchor, since 'four rolls of a 1/6 chance' feels like it should be more.",
        hints: [
          { level: 1, text: "Summing over 'exactly one, exactly two, …' works but is four times the effort." },
          { level: 2, text: "What is the complement of 'at least one six'?" },
          { level: 3, text: "Every roll must miss, so P(no six) = (5/6)⁴; subtract from 1." },
        ],
      },
      {
        id: "4.1-p3",
        prompt:
          "An integer is drawn uniformly from 1 to 100. What is P(it is divisible by 3 or by 5)? (Decimal, 2 dp.)",
        answer: "0.47",
        answerValue: 0.47,
        tolerance: 0.005,
        gradingType: "numeric_tolerance",
        difficulty: 2,
        targetSeconds: 30,
        explanation:
          "Multiples of 3: ⌊100/3⌋ = 33. Of 5: 20. Of 15 (both): 6. So 33 + 20 − 6 = 47, giving 0.47. Forgetting to subtract the multiples of 15 gives 0.53.",
        hints: [
          { level: 1, text: "Count each set with a floor division, then fix the overlap." },
          { level: 2, text: "Numbers divisible by both 3 and 5 are divisible by 15." },
          { level: 3, text: "(33 + 20 − 6)/100." },
        ],
      },
      {
        id: "4.1-p4",
        prompt:
          "Three fair coins are flipped. What is P(you get at least one head AND at least one tail)? (Decimal, 4 dp.)",
        answer: "0.75",
        answerValue: 0.75,
        tolerance: 0.005,
        gradingType: "numeric_tolerance",
        difficulty: 2,
        targetSeconds: 25,
        explanation:
          "The only failures are all-heads and all-tails: 2 of the 8 sequences. So 1 − 2/8 = 3/4. Attacking it directly means counting 'exactly one head' plus 'exactly two heads' = 3 + 3 = 6 — same answer, more work.",
        hints: [
          { level: 1, text: "Which sequences fail the condition? There are very few." },
          { level: 2, text: "It fails only when all three coins match — HHH or TTT." },
          { level: 3, text: "Two of the eight sequences fail, so the answer is 1 − 2/8." },
        ],
      },
      {
        id: "4.1-p5",
        prompt:
          "Two fair dice are rolled. What is P(the sum is even OR the sum is greater than 9)? (Decimal, 4 dp.)",
        answer: "0.5556",
        answerValue: 0.5556,
        tolerance: 0.005,
        gradingType: "numeric_tolerance",
        difficulty: 3,
        targetSeconds: 45,
        explanation:
          "Even sum: 18/36 (the two dice match in parity). Sum > 9: sums 10, 11, 12 give 3 + 2 + 1 = 6/36. Both even and > 9: sums 10 and 12 give 3 + 1 = 4/36. So (18 + 6 − 4)/36 = 20/36 = 5/9 ≈ 0.5556.",
        hints: [
          { level: 1, text: "An even sum means both dice have the same parity — that's a fast 18/36." },
          { level: 2, text: "The overlap is the even sums above 9. Which sums are those?" },
          { level: 3, text: "(18 + 6 − 4)/36, where the overlap is sums 10 and 12." },
        ],
      },
      {
        id: "4.1-p6",
        prompt:
          "A fair die is rolled twice. What is P(neither roll shows a 1 and neither shows a 6)? (Decimal, 4 dp.)",
        answer: "0.4444",
        answerValue: 0.4444,
        tolerance: 0.005,
        gradingType: "numeric_tolerance",
        difficulty: 1,
        targetSeconds: 20,
        explanation:
          "Each roll must land in {2,3,4,5}: 4/6 = 2/3 per roll, and the rolls are independent, so (2/3)² = 4/9 ≈ 0.4444.",
        hints: [
          { level: 1, text: "'Neither' means both rolls avoid the forbidden faces." },
          { level: 2, text: "How many faces are allowed on a single roll?" },
          { level: 3, text: "Four of six faces are allowed on each roll, so (4/6)²." },
        ],
      },
    ],
    bookProblems: [
      { id: "4.1-b1", title: "Coin toss game", page: 61 },
      { id: "4.1-b2", title: "Card game", page: 61 },
      { id: "4.1-b3", title: "Drunk passenger", page: 62 },
      { id: "4.1-b4", title: "N points on a circle", page: 63 },
    ],
  },

  /* ------------------------------------------------------------------ 4.2 */
  {
    slug: "4.2-combinatorial-analysis",
    chapter: 4,
    number: "4.2",
    title: "Combinatorial Analysis",
    pages: [64, 72],
    topic: "probability",
    summary:
      "Counting properly: when order matters, when it doesn't, and how to count the complement instead.",
    concept: [
      "Combinatorics is where most probability answers are actually won or lost. The mechanics are short — permutations, combinations, and the multiplication rule — but choosing which to apply, and being consistent about it in numerator and denominator, is the skill.",
      "Ask two questions of every count. Does order matter? And can items repeat? Order matters and no repeats gives permutations, n!/(n−k)!. Order doesn't matter and no repeats gives combinations, C(n,k) = n!/(k!(n−k)!). Order matters with repeats allowed is simply nᵏ. The fourth case — order doesn't matter, repeats allowed — is stars and bars: distributing k identical items into n bins is C(k+n−1, n−1).",
      "The most common error is mixing conventions. If your numerator treats hands as unordered, the denominator must too. Both are correct as long as they match; C(52,5) with unordered favourable counts, or 52·51·50·49·48 with ordered ones, give the same answer.",
      "When identical items are being arranged, divide by the factorial of each repeat group: the arrangements of a word with letter counts n₁, n₂, … are n!/(n₁! n₂! …). And when a count looks unpleasant, count what you don't want: 'at least one' and 'not all distinct' are usually far shorter from the complement.",
    ],
    keyIdeas: [
      {
        name: "The four counting cases",
        body: "Ordered, no repeats: n!/(n−k)!. Unordered, no repeats: C(n,k). Ordered with repeats: nᵏ. Unordered with repeats: C(k+n−1, n−1).",
      },
      {
        name: "Keep numerator and denominator consistent",
        body: "Both ordered or both unordered. Mixing them is the single biggest source of wrong answers in poker-hand style questions.",
      },
      {
        name: "Repeated items divide out",
        body: "Arrangements of n items with repeat groups n₁, n₂, … number n!/(n₁! n₂! …). Circular arrangements of n distinct items number (n−1)!, because rotations are the same seating.",
      },
      {
        name: "Complementary counting",
        body: "Count the bad cases when they're fewer. 'At least one shared birthday' is 1 − (all distinct).",
      },
    ],
    checkYourself: [
      "Why is the number of circular seatings of n people (n−1)! rather than n!?",
      "You compute a poker probability with an unordered numerator and an ordered denominator. What goes wrong, and by what factor?",
      "How many ways can 10 identical balls go into 4 distinct boxes, and why is it a combination rather than a power?",
    ],
    examples: [
      {
        id: "4.2-ex1",
        prompt:
          "A 5-card hand is dealt from a standard deck. What is the probability it contains exactly one pair — two cards of one rank and three cards of three other, distinct ranks?",
        steps: [
          "Decide the convention: hands are unordered, so the denominator is C(52,5) = 2,598,960.",
          "Choose the rank that pairs: 13 ways. Choose its two suits: C(4,2) = 6.",
          "Choose the three other ranks — distinct, and none of them may pair: C(12,3) = 220.",
          "Give each of those three ranks a suit: 4 choices each, so 4³ = 64.",
          "Numerator = 13 × 6 × 220 × 64 = 1,098,240. Divide: 1,098,240 / 2,598,960 ≈ 0.4226.",
        ],
        answer: "≈ 0.4226",
        takeaway:
          "Choose ranks first, then suits — mixing the two orders is where double counting creeps in. Note C(12,3) rather than 12·11·10: the three kicker ranks are unordered, matching the unordered denominator.",
      },
    ],
    problems: [
      {
        id: "4.2-p1",
        prompt: "How many distinct arrangements are there of the letters in BANANA?",
        answer: "60",
        answerValue: 60,
        gradingType: "exact",
        difficulty: 2,
        targetSeconds: 30,
        explanation:
          "6 letters with three As and two Ns: 6!/(3!·2!·1!) = 720/12 = 60. Treating the letters as distinct gives 720, which overcounts by 3!·2! = 12.",
        hints: [
          { level: 1, text: "If all six letters were different the answer would be 6!. What spoils that?" },
          { level: 2, text: "Divide by the factorial of each repeated letter's count." },
          { level: 3, text: "6!/(3! · 2!)." },
        ],
      },
      {
        id: "4.2-p2",
        prompt: "Eight people sit around a circular table. How many distinct seatings are there, treating rotations as the same seating?",
        answer: "5040",
        answerValue: 5040,
        gradingType: "exact",
        difficulty: 2,
        targetSeconds: 30,
        explanation:
          "Fix one person to kill the rotational symmetry, then arrange the other 7 freely: 7! = 5040. Equivalently 8!/8.",
        hints: [
          { level: 1, text: "In a line it would be 8!. A circle has a symmetry a line doesn't." },
          { level: 2, text: "How many rotations map a seating to itself-as-a-pattern? Divide by that." },
          { level: 3, text: "There are 8 rotations of each seating, so 8!/8 = 7!." },
        ],
      },
      {
        id: "4.2-p3",
        prompt:
          "From 10 people, how many ways are there to choose a committee of 4 and designate one of its members as chair?",
        answer: "840",
        answerValue: 840,
        gradingType: "exact",
        difficulty: 3,
        targetSeconds: 40,
        explanation:
          "Choose the committee then the chair: C(10,4) × 4 = 210 × 4 = 840. Or choose the chair first then three others: 10 × C(9,3) = 10 × 84 = 840. Two routes agreeing is the check.",
        hints: [
          { level: 1, text: "Two decisions. You can make them in either order — try both and confirm they agree." },
          { level: 2, text: "Committee first: C(10,4), then pick the chair from inside it." },
          { level: 3, text: "Pick the four members with C(10,4), then the chair from among them: × 4." },
        ],
      },
      {
        id: "4.2-p4",
        prompt:
          "How many ways can 10 identical balls be placed into 4 distinct boxes, allowing empty boxes?",
        answer: "286",
        answerValue: 286,
        gradingType: "exact",
        difficulty: 3,
        targetSeconds: 45,
        explanation:
          "Stars and bars: 10 stars and 3 bars in a row, so C(10+3, 3) = C(13,3) = 286. The balls being identical is what makes it a combination rather than 4¹⁰.",
        hints: [
          { level: 1, text: "The balls are identical, so only the counts per box matter." },
          { level: 2, text: "Represent a distribution as 10 stars separated by 3 bars." },
          { level: 3, text: "Ten stars and three bars in a row, so C(13,3)." },
        ],
      },
      {
        id: "4.2-p5",
        prompt:
          "A 5-card hand is dealt from a standard deck. What is P(it contains all four aces)? (Decimal, 6 dp.)",
        answer: "0.0000185",
        answerValue: 0.0000185,
        tolerance: 0.05,
        gradingType: "numeric_tolerance",
        difficulty: 3,
        targetSeconds: 40,
        explanation:
          "Take all four aces and any fifth card: C(4,4) × C(48,1) = 48 favourable hands out of C(52,5) = 2,598,960, so 48/2,598,960 ≈ 1.85 × 10⁻⁵.",
        hints: [
          { level: 1, text: "Four of the five cards are forced. What's left to choose?" },
          { level: 2, text: "Count the hands: 48 of them, one per possible fifth card." },
          { level: 3, text: "48 / C(52,5)." },
        ],
      },
      {
        id: "4.2-p6",
        prompt:
          "In a room of 5 people, what is P(all 5 birthdays fall in different months)? Assume 12 equally likely months. (Decimal, 4 dp.)",
        answer: "0.3819",
        answerValue: 0.3819,
        tolerance: 0.005,
        gradingType: "numeric_tolerance",
        difficulty: 3,
        targetSeconds: 45,
        explanation:
          "(12/12)(11/12)(10/12)(9/12)(8/12) = 95,040/248,832 ≈ 0.3819. Each new person must avoid the months already used — the birthday-problem structure with 12 slots instead of 365.",
        hints: [
          { level: 1, text: "Go person by person: each must miss every month already taken." },
          { level: 2, text: "The first is free, the second has 11/12, the third 10/12, and so on." },
          { level: 3, text: "12·11·10·9·8 / 12⁵." },
        ],
      },
    ],
    bookProblems: [
      { id: "4.2-b1", title: "Poker hands", page: 65 },
      { id: "4.2-b2", title: "Hopping rabbit", page: 66 },
      { id: "4.2-b3", title: "Screwy pirates 2", page: 67 },
      { id: "4.2-b4", title: "Chess tournament", page: 68 },
      { id: "4.2-b5", title: "Application letters", page: 69 },
      { id: "4.2-b6", title: "Birthday problem", page: 71 },
      { id: "4.2-b7", title: "100th digit", page: 71 },
      { id: "4.2-b8", title: "Cubic of integer", page: 72 },
    ],
  },

  /* ------------------------------------------------------------------ 4.3 */
  {
    slug: "4.3-conditional-probability-and-bayes",
    chapter: 4,
    number: "4.3",
    title: "Conditional Probability and Bayes' Formula",
    pages: [72, 85],
    topic: "conditional-probability",
    summary:
      "Updating on evidence — the largest section in the chapter, and the one interviews lean on hardest.",
    concept: [
      "Conditioning is restriction. P(A | B) = P(A ∩ B) / P(B) says: throw away every outcome where B didn't happen, then ask how much of what's left is A. Drawing the restricted sample space explicitly, at least for the first few problems, prevents most errors.",
      "Two tools follow. The law of total probability breaks a hard question into cases you can handle: P(A) = Σ P(A | Bᵢ)P(Bᵢ) over any partition. Bayes' formula runs it backwards — from P(evidence | cause) to P(cause | evidence): P(B | A) = P(A | B)P(B) / P(A), with the denominator usually expanded by total probability.",
      "For anything test-shaped, don't use the formula — use natural frequencies. Imagine 10,000 people, push them through the tree, and count. A 1% base rate with a 99%-accurate test and a 5% false-positive rate gives 99 true positives against 495 false ones, so a positive test means about a 1-in-6 chance of being ill. The formula gives the same number but hides why: at a low base rate the healthy population is so much larger that its few percent of false positives swamps the sick group entirely.",
      "The classic trap is conditioning on 'at least one' as though it were 'a specific one'. Two children, at least one a girl: the equally likely orderings are BB, BG, GB, GG; the evidence kills BB, leaving three, of which one is GG — so 1/3. But 'the elder is a girl' leaves GB and GG, giving 1/2. The evidence is different, so the answer is different. Whenever a question is vague about which item the evidence refers to, that ambiguity *is* the question.",
      "Gambler's ruin is the recurring set-piece. With a fair game, starting at i with target N, the probability of reaching N before 0 is simply i/N. When the game is biased with win probability p, let r = q/p; then the probability is (1 − rⁱ)/(1 − r^N). Recognising that shape saves several minutes under pressure.",
    ],
    keyIdeas: [
      {
        name: "Conditioning is restriction",
        body: "P(A | B) = P(A ∩ B)/P(B). Shrink the sample space to B, then recount. Write the surviving outcomes out if there are few.",
      },
      {
        name: "Total probability",
        body: "P(A) = Σ P(A | Bᵢ)P(Bᵢ) over a partition. Choose the partition that makes each conditional easy.",
      },
      {
        name: "Bayes by natural frequencies",
        body: "Take 10,000 imaginary people, run them through the tree, count. Faster and far less error-prone than the formula, and it shows why base rates dominate.",
      },
      {
        name: "'At least one' ≠ 'this one'",
        body: "Two children with at least one girl gives P(both girls) = 1/3; the elder being a girl gives 1/2. Identify exactly what the evidence pins down.",
      },
      {
        name: "Gambler's ruin",
        body: "Fair game from i toward N: i/N. Biased with r = q/p: (1 − rⁱ)/(1 − r^N).",
      },
    ],
    checkYourself: [
      "Why does 'at least one girl' give 1/3 while 'the elder is a girl' gives 1/2?",
      "A test is 99% accurate and the disease affects 1 in 100. Roughly what does a positive result mean, and why isn't it 99%?",
      "In a fair gambler's ruin from 3 toward 10, why is the answer exactly 3/10 with no dependence on the bet size?",
    ],
    examples: [
      {
        id: "4.3-ex1",
        prompt:
          "A screening test detects a condition 90% of the time and falsely flags 8% of healthy people. The condition affects 2% of the population. Someone tests positive. What is the probability they have it?",
        steps: [
          "Don't reach for the formula. Take a concrete population: 10,000 people.",
          "2% have the condition: 200 sick, 9,800 healthy.",
          "Of the 200 sick, the test catches 90%: 180 true positives.",
          "Of the 9,800 healthy, 8% are falsely flagged: 784 false positives.",
          "Positives total 180 + 784 = 964, of which 180 are genuine: 180/964 ≈ 0.1867.",
        ],
        answer: "≈ 0.187, so under 1 in 5",
        takeaway:
          "The test is good and the answer is still under 20%, because the healthy group is 49× larger — its 8% error rate produces four times more positives than the sick group's 90% hit rate. Base rate beats accuracy whenever the condition is rare.",
      },
      {
        id: "4.3-ex2",
        prompt:
          "You start with $4 and bet $1 on a fair coin repeatedly, stopping at $0 or $10. What is the probability you reach $10?",
        steps: [
          "Let p(i) be the probability of reaching 10 from i dollars. Then p(0) = 0 and p(10) = 1.",
          "Each step is fair, so p(i) = ½p(i−1) + ½p(i+1) — every interior point is the average of its neighbours.",
          "A function whose every interior value is the average of its neighbours is linear, so p(i) = i/10.",
          "Therefore p(4) = 0.4.",
          "Sanity check: your wealth is a martingale, so E[final] = 4. Since the final value is 0 or 10, 10·p = 4 and p = 0.4 — the same answer in one line.",
        ],
        answer: "0.4",
        takeaway:
          "The martingale argument is the one to reach for: in a fair game your expected final wealth equals your starting wealth, which pins the probability immediately. The bet size never enters.",
      },
    ],
    problems: [
      {
        id: "4.3-p1",
        prompt:
          "A family has two children. Given that at least one is a girl, what is P(both are girls)? (Decimal, 4 dp.)",
        answer: "0.3333",
        answerValue: 0.3333,
        tolerance: 0.01,
        gradingType: "numeric_tolerance",
        difficulty: 2,
        targetSeconds: 30,
        explanation:
          "Equally likely orderings BB, BG, GB, GG. The evidence eliminates BB, leaving three, of which one is GG: 1/3. Answering 1/2 means you conditioned on a specific child instead of on 'at least one'.",
        hints: [
          { level: 1, text: "List all four equally likely birth orders before conditioning." },
          { level: 2, text: "Which of the four does the evidence rule out? How many remain?" },
          { level: 3, text: "Three orders survive; exactly one is two girls." },
        ],
      },
      {
        id: "4.3-p2",
        prompt:
          "1% of a population has a condition. A test detects it 99% of the time and falsely flags 5% of healthy people. Given a positive test, what is P(the person has the condition)? (Decimal, 4 dp.)",
        answer: "0.1667",
        answerValue: 0.1667,
        tolerance: 0.01,
        gradingType: "numeric_tolerance",
        difficulty: 3,
        targetSeconds: 50,
        explanation:
          "Per 10,000 people: 100 sick → 99 true positives; 9,900 healthy → 495 false positives. So 99/(99+495) = 99/594 = 1/6 ≈ 0.1667. A 99%-accurate test still leaves five in six positives healthy, because the healthy group is 99× larger.",
        hints: [
          { level: 1, text: "Use a population of 10,000 rather than the formula." },
          { level: 2, text: "How many true positives, and how many false positives, in that 10,000?" },
          { level: 3, text: "99/(99 + 495)." },
        ],
      },
      {
        id: "4.3-p3",
        prompt:
          "Urn A holds 2 red and 3 blue balls; urn B holds 4 red and 1 blue. You pick an urn at random and draw one ball, which is red. What is P(you picked urn A)? (Decimal, 4 dp.)",
        answer: "0.3333",
        answerValue: 0.3333,
        tolerance: 0.01,
        gradingType: "numeric_tolerance",
        difficulty: 3,
        targetSeconds: 45,
        explanation:
          "P(red | A) = 2/5 = 0.4 and P(red | B) = 4/5 = 0.8. The priors are equal so they cancel: 0.4/(0.4 + 0.8) = 1/3 ≈ 0.3333. Drawing red is twice as likely from B, so B becomes twice as likely as A.",
        hints: [
          { level: 1, text: "Compute P(red) under each urn first." },
          { level: 2, text: "The two urns were equally likely a priori, so the priors cancel in Bayes." },
          { level: 3, text: "0.4/(0.4 + 0.8)." },
        ],
      },
      {
        id: "4.3-p4",
        prompt:
          "You start with $3 and bet $1 at a time on a fair coin, stopping at $0 or $10. What is P(you reach $10)? (Decimal, 2 dp.)",
        answer: "0.3",
        answerValue: 0.3,
        tolerance: 0.01,
        gradingType: "numeric_tolerance",
        difficulty: 3,
        targetSeconds: 40,
        explanation:
          "Fair gambler's ruin: from i toward N the answer is i/N = 3/10 = 0.3. Fastest route: wealth is a martingale, so E[final] = 3; the final value is 0 or 10, giving 10p = 3.",
        hints: [
          { level: 1, text: "In a fair game, what is your expected wealth when you stop?" },
          { level: 2, text: "It equals what you started with. The final wealth is either 0 or 10." },
          { level: 3, text: "Expected final wealth equals the $3 you started with, and the finish is 0 or 10, so 10p = 3." },
        ],
      },
      {
        id: "4.3-p5",
        prompt:
          "You start with $1 and bet $1 at a time, winning each bet with probability 0.4, stopping at $0 or $3. What is P(you reach $3)? (Decimal, 4 dp.)",
        answer: "0.2105",
        answerValue: 0.2105,
        tolerance: 0.005,
        gradingType: "numeric_tolerance",
        difficulty: 4,
        targetSeconds: 70,
        explanation:
          "Biased gambler's ruin with r = q/p = 0.6/0.4 = 1.5: P = (1 − r¹)/(1 − r³) = (1 − 1.5)/(1 − 3.375) = (−0.5)/(−2.375) ≈ 0.2105. The fair-game answer would have been 1/3, so a 10-point edge against you costs about a third of your chance.",
        hints: [
          { level: 1, text: "The martingale shortcut is gone — the game isn't fair. Use the ruin formula." },
          { level: 2, text: "With r = q/p, the probability from i toward N is (1 − rⁱ)/(1 − r^N)." },
          { level: 3, text: "r = 1.5, i = 1, N = 3: (1 − 1.5)/(1 − 3.375)." },
        ],
      },
      {
        id: "4.3-p6",
        prompt:
          "Three doors hide one prize. You pick one, the host — who knows where the prize is — opens a different door revealing no prize, and offers you the switch. What is P(you win by switching)? (Decimal, 4 dp.)",
        answer: "0.6667",
        answerValue: 0.6667,
        tolerance: 0.01,
        gradingType: "numeric_tolerance",
        difficulty: 3,
        targetSeconds: 45,
        explanation:
          "Switching wins exactly when your first pick was wrong, which happens 2/3 of the time. The host's action carries information because it was constrained — he could never open the prize door. If he opened a door at random and happened to miss the prize, the answer would be 1/2.",
        hints: [
          { level: 1, text: "Switching wins precisely when your original choice was wrong." },
          { level: 2, text: "How often is your original choice wrong?" },
          { level: 3, text: "Your first pick is wrong two times in three, and those are exactly the times switching wins." },
        ],
      },
      {
        id: "4.3-p7",
        prompt:
          "You roll two fair dice one at a time. Given that the first shows an even number, what is P(the sum is 8)? (Decimal, 4 dp.)",
        answer: "0.1667",
        answerValue: 0.1667,
        tolerance: 0.01,
        gradingType: "numeric_tolerance",
        difficulty: 3,
        targetSeconds: 45,
        explanation:
          "Condition on the first die: it is 2, 4 or 6 with probability 1/3 each. The second must be 6, 4 or 2 respectively — always exactly one face out of six. So the answer is 1/6 ≈ 0.1667 regardless of which even number appeared.",
        hints: [
          { level: 1, text: "Split by the value of the first die: 2, 4 or 6." },
          { level: 2, text: "For each, how many values of the second die give a sum of 8?" },
          { level: 3, text: "Exactly one in every case, so 1/6." },
        ],
      },
    ],
    bookProblems: [
      { id: "4.3-b1", title: "Boys and girls", page: 73 },
      { id: "4.3-b2", title: "All-girl world?", page: 74 },
      { id: "4.3-b3", title: "Unfair coin", page: 74 },
      { id: "4.3-b4", title: "Fair probability from an unfair coin", page: 75 },
      { id: "4.3-b5", title: "Dart game", page: 75 },
      { id: "4.3-b6", title: "Birthday line", page: 76 },
      { id: "4.3-b7", title: "Dice order", page: 78 },
      { id: "4.3-b8", title: "Monty Hall problem", page: 78 },
      { id: "4.3-b9", title: "Amoeba population", page: 79 },
      { id: "4.3-b10", title: "Candies in a jar", page: 79 },
      { id: "4.3-b11", title: "Coin toss game", page: 80 },
      { id: "4.3-b12", title: "Russian roulette series", page: 81 },
      { id: "4.3-b13", title: "Aces", page: 82 },
      { id: "4.3-b14", title: "Gambler's ruin problem", page: 83 },
      { id: "4.3-b15", title: "Basketball scores", page: 84 },
      { id: "4.3-b16", title: "Cars on road", page: 85 },
    ],
  },

  /* ------------------------------------------------------------------ 4.4 */
  {
    slug: "4.4-discrete-and-continuous-distributions",
    chapter: 4,
    number: "4.4",
    title: "Discrete and Continuous Distributions",
    pages: [86, 91],
    topic: "probability",
    summary:
      "The handful of distributions that cover almost every interview question, and when each one applies.",
    concept: [
      "You need six distributions cold, and more importantly you need to recognise which situation produces which. Binomial: a fixed number of independent trials, counting successes, P(X = k) = C(n,k)pᵏ(1−p)ⁿ⁻ᵏ, mean np, variance np(1−p). Geometric: independent trials until the first success, mean 1/p. Poisson: counts of rare events in a fixed window at constant rate, P(X = k) = e^(−λ)λᵏ/k!, mean and variance both λ. Exponential: the waiting time between Poisson events, mean 1/λ. Uniform and normal complete the set.",
      "Poisson and exponential are two views of one process. If events arrive at rate λ, the count in a unit window is Poisson(λ) and the gap between consecutive events is Exponential(λ). A question phrased as 'how many' wants Poisson; 'how long until' wants exponential.",
      "Memorylessness is the property worth internalising. For an exponential waiting time, P(X > s + t | X > s) = P(X > t): having already waited tells you nothing about the remaining wait. The geometric distribution has the same property in discrete time, which is exactly what makes recursive expected-value arguments work.",
      "For the normal, three numbers get you a long way: about 68% of mass within one standard deviation, 95% within two, 99.7% within three. So P(Z > 2) ≈ 2.3%, and a 'two-sigma event' is roughly a 1-in-40 occurrence one-tailed. Being able to quote these without a table is often the whole point of the question.",
      "Finally, a useful approximation: Binomial(n, p) with large n and small np behaves like Poisson(np). It converts an unpleasant binomial into a one-line exponential.",
    ],
    keyIdeas: [
      {
        name: "Match the situation to the distribution",
        body: "Fixed trials, count successes → binomial. Trials until first success → geometric. Rare events per window → Poisson. Time until next event → exponential.",
      },
      {
        name: "Poisson ↔ exponential",
        body: "Same process, two questions. Counts are Poisson(λ); inter-arrival times are Exponential(λ), mean 1/λ.",
      },
      {
        name: "Memorylessness",
        body: "P(X > s + t | X > s) = P(X > t) for the exponential, and its discrete analogue for the geometric. Waiting already done buys you nothing.",
      },
      {
        name: "68–95–99.7",
        body: "Normal mass within 1, 2, 3 standard deviations. So P(Z > 2) ≈ 0.023 — worth knowing to a digit without a table.",
      },
    ],
    checkYourself: [
      "A process averages 3 events an hour. What's the chance of none in the next hour, and what distribution did you use for 'how long until the next one'?",
      "Why does the exponential's memorylessness make recursive expected-value arguments valid?",
      "When is Binomial(n,p) well approximated by Poisson(np), and why is that useful?",
    ],
    examples: [
      {
        id: "4.4-ex1",
        prompt:
          "Two people each arrive at a uniformly random time between 12:00 and 13:00, independently. Each waits 15 minutes and then leaves. What is the probability they meet?",
        steps: [
          "Let x and y be the arrival minutes, each uniform on [0,60] and independent — so (x,y) is uniform on a 60×60 square.",
          "They meet exactly when |x − y| ≤ 15. Geometry, not calculus: measure the area of that band.",
          "The failures are the two corner triangles where |x − y| > 15. Each is a right triangle with legs 45.",
          "Each triangle has area ½·45·45 = 1012.5, so the two together are 2025 out of the square's 3600.",
          "P(meet) = 1 − 2025/3600 = 1 − 0.5625 = 0.4375.",
        ],
        answer: "0.4375",
        takeaway:
          "Two independent uniforms make a square, and a condition on their difference becomes an area. The general answer for a wait of w in a window T is 1 − (1 − w/T)², which here is 1 − (45/60)².",
      },
    ],
    problems: [
      {
        id: "4.4-p1",
        prompt:
          "A fair coin is flipped 10 times. What is P(exactly 4 heads)? (Decimal, 4 dp.)",
        answer: "0.2051",
        answerValue: 0.2051,
        tolerance: 0.005,
        gradingType: "numeric_tolerance",
        difficulty: 2,
        targetSeconds: 35,
        explanation:
          "Binomial with n = 10, p = ½: C(10,4)/2¹⁰ = 210/1024 ≈ 0.2051. Note it is below the 0.246 you get at exactly 5 heads — the distribution peaks at the mean.",
        hints: [
          { level: 1, text: "Fixed number of trials, counting successes — which distribution?" },
          { level: 2, text: "C(10,4) sequences out of 2¹⁰ equally likely ones." },
          { level: 3, text: "There are C(10,4) = 210 favourable sequences out of 2¹⁰ = 1024." },
        ],
      },
      {
        id: "4.4-p2",
        prompt:
          "Events arrive as a Poisson process averaging 3 per hour. What is P(no events in the next hour)? (Decimal, 4 dp.)",
        answer: "0.0498",
        answerValue: 0.0498,
        tolerance: 0.005,
        gradingType: "numeric_tolerance",
        difficulty: 2,
        targetSeconds: 30,
        explanation:
          "Poisson with λ = 3: P(0) = e⁻³ ≈ 0.0498. Worth memorising e⁻¹ ≈ 0.368, e⁻² ≈ 0.135, e⁻³ ≈ 0.050.",
        hints: [
          { level: 1, text: "λ = 3 for a one-hour window." },
          { level: 2, text: "P(X = 0) = e^(−λ)λ⁰/0!." },
          { level: 3, text: "Substitute k = 0 into the Poisson formula: e^(−λ) with λ = 3." },
        ],
      },
      {
        id: "4.4-p3",
        prompt:
          "A component's lifetime is exponential with a mean of 5 years. What is P(it lasts more than 8 years)? (Decimal, 4 dp.)",
        answer: "0.2019",
        answerValue: 0.2019,
        tolerance: 0.005,
        gradingType: "numeric_tolerance",
        difficulty: 3,
        targetSeconds: 40,
        explanation:
          "Mean 5 means λ = 1/5, and P(X > t) = e^(−λt) = e^(−8/5) = e⁻¹·⁶ ≈ 0.2019.",
        hints: [
          { level: 1, text: "For an exponential, the survival function is a clean exponential." },
          { level: 2, text: "P(X > t) = e^(−t/mean)." },
          { level: 3, text: "λ = 1/5 because the mean is 5, so P(X > 8) = e^(−8/5)." },
        ],
      },
      {
        id: "4.4-p4",
        prompt:
          "A component's lifetime is exponential with a mean of 5 years. Given it has already lasted 7 years, what is P(it lasts at least 5 more)? (Decimal, 4 dp.)",
        answer: "0.3679",
        answerValue: 0.3679,
        tolerance: 0.005,
        gradingType: "numeric_tolerance",
        difficulty: 3,
        targetSeconds: 45,
        explanation:
          "Memorylessness: the 7 years already survived are irrelevant, so the answer is P(X > 5) = e^(−5/5) = e⁻¹ ≈ 0.3679. Any answer that depends on the 7 has missed the point of the distribution.",
        hints: [
          { level: 1, text: "This is the defining property of the exponential." },
          { level: 2, text: "P(X > s + t | X > s) = P(X > t)." },
          { level: 3, text: "e^(−5/5) = e⁻¹." },
        ],
      },
      {
        id: "4.4-p5",
        prompt:
          "Z is standard normal. What is P(Z > 2)? (Decimal, 4 dp.)",
        answer: "0.0228",
        answerValue: 0.0228,
        tolerance: 0.003,
        gradingType: "numeric_tolerance",
        difficulty: 2,
        targetSeconds: 30,
        explanation:
          "About 95% of the mass lies within two standard deviations, leaving 5% split between the tails: roughly 2.5% each, and more precisely 0.0228.",
        hints: [
          { level: 1, text: "Use 68–95–99.7 rather than a table." },
          { level: 2, text: "95% within ±2 leaves 5% in the two tails together." },
          { level: 3, text: "Half of 5%, so about 2.3%." },
        ],
      },
      {
        id: "4.4-p6",
        prompt:
          "Two numbers are drawn independently and uniformly from [0,1]. What is P(both exceed 0.7)? (Decimal, 2 dp.)",
        answer: "0.09",
        answerValue: 0.09,
        tolerance: 0.005,
        gradingType: "numeric_tolerance",
        difficulty: 1,
        targetSeconds: 20,
        explanation:
          "A single uniform draw exceeds 0.7 with probability 0.3, and the draws are independent, so (0.3)² = 0.09. This is also P(the minimum exceeds 0.7) — the same order-statistic product that section 4.6 generalises.",
        hints: [
          { level: 1, text: "What is P(a single draw exceeds 0.7)?" },
          { level: 2, text: "The draws are independent, so the two probabilities multiply." },
          { level: 3, text: "Each draw clears 0.7 with probability 0.3, so square it: 0.3²." },
        ],
      },
      {
        id: "4.4-p7",
        prompt:
          "A machine produces defects at a rate of 0.5% and you inspect 400 items. Using a Poisson approximation, what is P(no defects)? (Decimal, 4 dp.)",
        answer: "0.1353",
        answerValue: 0.1353,
        tolerance: 0.01,
        gradingType: "numeric_tolerance",
        difficulty: 4,
        targetSeconds: 55,
        explanation:
          "λ = np = 400 × 0.005 = 2, so P(0) ≈ e⁻² ≈ 0.1353. The exact binomial 0.995⁴⁰⁰ ≈ 0.1348 — the approximation is good to well within a percent because n is large and p is small.",
        hints: [
          { level: 1, text: "Large n, small p — the binomial has a one-line approximation." },
          { level: 2, text: "Poisson with λ = np. What is np here?" },
          { level: 3, text: "λ = np = 400 × 0.005 = 2, so P(0) = e⁻²." },
        ],
      },
    ],
    bookProblems: [
      { id: "4.4-b1", title: "Meeting probability", page: 88 },
      { id: "4.4-b2", title: "Probability of triangle", page: 89 },
      { id: "4.4-b3", title: "Property of Poisson process", page: 90 },
      { id: "4.4-b4", title: "Moments of normal distribution", page: 91 },
    ],
  },

  /* ------------------------------------------------------------------ 4.5 */
  {
    slug: "4.5-expected-value-variance-covariance",
    chapter: 4,
    number: "4.5",
    title: "Expected Value, Variance & Covariance",
    pages: [92, 98],
    topic: "expected-value",
    summary:
      "Linearity, the variance algebra, and the hedge-ratio calculation that turns covariance into a trading decision.",
    concept: [
      "Linearity of expectation is the most useful fact in the chapter: E[X + Y] = E[X] + E[Y] always, whether or not X and Y are independent. Problems that look intractable collapse when you write the quantity as a sum of simple pieces — usually indicator variables, where E[1_A] = P(A). Coupon collecting, expected numbers of matches, expected cycle counts: all are sums of indicators.",
      "Variance is not linear, and that asymmetry is where the content is. Var(aX + b) = a²Var(X) — the shift does nothing, the scale squares. Var(X + Y) = Var(X) + Var(Y) + 2Cov(X,Y), so variances only add when the covariance is zero. Var(X − Y) = Var(X) + Var(Y) − 2Cov(X,Y), which is why hedging works at all.",
      "Covariance measures co-movement in the units of X times Y, which makes it hard to interpret. Correlation normalises it: ρ = Cov(X,Y)/(σ_X σ_Y), always in [−1,1]. Independent implies zero covariance, but zero covariance does not imply independent — a standard follow-up question.",
      "The hedge-ratio result is worth deriving once and then knowing. To hedge A with B, hold A − hB and choose h to minimise the variance: Var = σ_A² + h²σ_B² − 2hρσ_Aσ_B. Differentiate and set to zero to get h* = ρσ_A/σ_B, at which the residual variance is σ_A²(1 − ρ²). So the best achievable risk reduction depends only on the correlation: at ρ = 0.8 you remove 64% of the variance, no matter what the volatilities are.",
      "Two numbers worth memorising for dice questions: a single fair die has mean 3.5 and variance 35/12 ≈ 2.917. The sum of two independent dice therefore has mean 7 and variance 35/6 ≈ 5.833.",
    ],
    keyIdeas: [
      {
        name: "Linearity always holds",
        body: "E[X + Y] = E[X] + E[Y] with no independence needed. Decompose into indicators and use E[1_A] = P(A).",
      },
      {
        name: "Variance algebra",
        body: "Var(aX + b) = a²Var(X). Var(X ± Y) = Var X + Var Y ± 2Cov(X,Y). Variances add only when the covariance vanishes.",
      },
      {
        name: "Correlation is normalised covariance",
        body: "ρ = Cov/(σ_X σ_Y) ∈ [−1,1]. Independence ⇒ zero covariance; the converse is false.",
      },
      {
        name: "Optimal hedge ratio",
        body: "h* = ρσ_A/σ_B, leaving residual variance σ_A²(1 − ρ²). The fraction of risk removed is ρ², independent of the volatilities.",
      },
    ],
    checkYourself: [
      "Why does linearity of expectation not require independence, while additivity of variance does?",
      "Give two variables with zero covariance that are plainly not independent.",
      "At ρ = 0.6, what fraction of A's variance can hedging with B remove, and what does that imply about how much correlation you need before hedging is worth the effort?",
    ],
    examples: [
      {
        id: "4.5-ex1",
        prompt:
          "You hold an asset A with 20% annual volatility and want to hedge it with asset B, which has 25% volatility and correlation 0.8 with A. How many units of B should you short per unit of A, and how much risk does that remove?",
        steps: [
          "The hedged position is A − hB, with variance σ_A² + h²σ_B² − 2hρσ_Aσ_B.",
          "This is a quadratic in h opening upwards, so differentiate: 2hσ_B² − 2ρσ_Aσ_B = 0.",
          "Solve: h* = ρσ_A/σ_B = 0.8 × 0.20/0.25 = 0.64. Short 0.64 units of B per unit of A.",
          "Residual variance is σ_A²(1 − ρ²) = 0.04 × (1 − 0.64) = 0.0144, so residual volatility is 12%.",
          "You removed 1 − ρ² = 36% of the variance, cutting volatility from 20% to 12%.",
        ],
        answer: "h* = 0.64; volatility falls from 20% to 12%",
        takeaway:
          "The hedge ratio depends on both volatilities, but the *fraction* of risk removed depends only on ρ². Correlation of 0.8 sounds high yet still leaves 60% of the original volatility standing — a good instinct to have about hedge quality.",
      },
    ],
    problems: [
      {
        id: "4.5-p1",
        prompt: "What is the variance of a single fair six-sided die roll? (Decimal, 4 dp.)",
        answer: "2.9167",
        answerValue: 2.9167,
        tolerance: 0.005,
        gradingType: "numeric_tolerance",
        difficulty: 3,
        targetSeconds: 45,
        explanation:
          "E[X] = 3.5 and E[X²] = (1+4+9+16+25+36)/6 = 91/6 ≈ 15.1667, so Var = 91/6 − 12.25 = 35/12 ≈ 2.9167.",
        hints: [
          { level: 1, text: "Var(X) = E[X²] − (E[X])²." },
          { level: 2, text: "E[X²] is the mean of the squares 1, 4, 9, 16, 25, 36." },
          { level: 3, text: "E[X²] = 91/6 and E[X] = 3.5, so Var = 91/6 − 3.5²." },
        ],
      },
      {
        id: "4.5-p2",
        prompt:
          "Var(X) = 4. What is Var(3X + 7)?",
        answer: "36",
        answerValue: 36,
        gradingType: "exact",
        difficulty: 2,
        targetSeconds: 20,
        explanation:
          "Var(aX + b) = a²Var(X) = 3² × 4 = 36. The +7 slides the whole distribution along without spreading it, so it cannot affect the variance; the scaling squares because variance is in squared units.",
        hints: [
          { level: 1, text: "One of the two constants does nothing at all." },
          { level: 2, text: "Adding a constant can't change spread; scaling squares it." },
          { level: 3, text: "Only the multiplier matters, and it squares: 3² × 4." },
        ],
      },
      {
        id: "4.5-p3",
        prompt:
          "Cov(X,Y) = 6, σ_X = 3, σ_Y = 4. What is the correlation? (Decimal, 2 dp.)",
        answer: "0.5",
        answerValue: 0.5,
        tolerance: 0.01,
        gradingType: "numeric_tolerance",
        difficulty: 2,
        targetSeconds: 25,
        explanation:
          "ρ = Cov/(σ_X σ_Y) = 6/(3 × 4) = 6/12 = 0.5. Correlation strips the units out of covariance, which is why it always lands in [−1,1] and covariance does not.",
        hints: [
          { level: 1, text: "Correlation is covariance in normalised units." },
          { level: 2, text: "Divide by the product of the standard deviations." },
          { level: 3, text: "Divide the covariance by both standard deviations: 6/(3 × 4)." },
        ],
      },
      {
        id: "4.5-p4",
        prompt:
          "Var(X) = 9, Var(Y) = 16, Cov(X,Y) = 6. What is Var(X − Y)?",
        answer: "13",
        answerValue: 13,
        gradingType: "exact",
        difficulty: 3,
        targetSeconds: 35,
        explanation:
          "Var(X − Y) = Var X + Var Y − 2Cov = 9 + 16 − 12 = 13. Positive covariance reduces the variance of a difference — the mechanism behind every hedge.",
        hints: [
          { level: 1, text: "The sign on the covariance term flips for a difference." },
          { level: 2, text: "Var(X − Y) = Var X + Var Y − 2Cov(X,Y)." },
          { level: 3, text: "9 + 16 − 2(6)." },
        ],
      },
      {
        id: "4.5-p5",
        prompt:
          "You hedge asset A (volatility 30%) with asset B (volatility 20%), correlation 0.6. What is the variance-minimising hedge ratio h*? (Decimal, 2 dp.)",
        answer: "0.9",
        answerValue: 0.9,
        tolerance: 0.01,
        gradingType: "numeric_tolerance",
        difficulty: 4,
        targetSeconds: 60,
        explanation:
          "h* = ρσ_A/σ_B = 0.6 × 0.30/0.20 = 0.9. Residual volatility is 0.30√(1 − 0.36) = 0.30 × 0.8 = 24%, so a correlation of 0.6 only takes 30% vol down to 24%.",
        hints: [
          { level: 1, text: "Minimise Var(A − hB) over h." },
          { level: 2, text: "h* = ρ σ_A/σ_B." },
          { level: 3, text: "Substitute into h* = ρσ_A/σ_B: 0.6 × 30/20." },
        ],
      },
      {
        id: "4.5-p6",
        prompt:
          "You roll a fair die repeatedly until you have seen all six faces. What is the expected number of rolls? (Decimal, 2 dp.)",
        answer: "14.7",
        answerValue: 14.7,
        tolerance: 0.01,
        gradingType: "numeric_tolerance",
        difficulty: 4,
        targetSeconds: 70,
        explanation:
          "Coupon collecting by linearity: once you hold k distinct faces, each new roll is new with probability (6−k)/6, so the wait is 6/(6−k). Summing over k = 0..5 gives 6(1 + 1/2 + 1/3 + 1/4 + 1/5 + 1/6) = 6 × 2.45 = 14.7. The last face alone costs 6 rolls.",
        hints: [
          { level: 1, text: "Split the wait into the stretch spent on each new face and add them." },
          { level: 2, text: "With k faces already seen, a new one arrives with probability (6−k)/6 — a geometric wait." },
          { level: 3, text: "6 × (1 + 1/2 + 1/3 + 1/4 + 1/5 + 1/6)." },
        ],
      },
      {
        id: "4.5-p7",
        prompt:
          "Two fair dice are rolled. What is the variance of their sum? (Decimal, 4 dp.)",
        answer: "5.8333",
        answerValue: 5.8333,
        tolerance: 0.005,
        gradingType: "numeric_tolerance",
        difficulty: 3,
        targetSeconds: 40,
        explanation:
          "The rolls are independent, so variances add: 35/12 + 35/12 = 35/6 ≈ 5.8333. Standard deviation ≈ 2.42.",
        hints: [
          { level: 1, text: "The dice are independent, which simplifies the variance of a sum." },
          { level: 2, text: "One die has variance 35/12." },
          { level: 3, text: "Independent variances add, and one die has variance 35/12." },
        ],
      },
    ],
    bookProblems: [
      { id: "4.5-b1", title: "Connecting noodles", page: 93 },
      { id: "4.5-b2", title: "Optimal hedge ratio", page: 94 },
      { id: "4.5-b3", title: "Dice game", page: 94 },
      { id: "4.5-b4", title: "Card game", page: 95 },
      { id: "4.5-b5", title: "Sum of random variables", page: 95 },
      { id: "4.5-b6", title: "Coupon collection", page: 97 },
      { id: "4.5-b7", title: "Joint default probability", page: 98 },
    ],
  },

  /* ------------------------------------------------------------------ 4.6 */
  {
    slug: "4.6-order-statistics",
    chapter: 4,
    number: "4.6",
    title: "Order Statistics",
    pages: [99, 102],
    topic: "probability",
    summary:
      "Maxima, minima and ranges of independent draws — a small set of results that come up constantly.",
    concept: [
      "Order statistics are what you get when you sort your sample. The two that matter are the maximum and the minimum, and both are easy because their cumulative distributions factorise. P(max ≤ t) = P(every draw ≤ t) = F(t)ⁿ, and P(min > t) = P(every draw > t) = (1 − F(t))ⁿ. Every result in this section follows from those two lines.",
      "For n independent uniforms on [0,1] this gives clean answers worth memorising: E[max] = n/(n+1) and E[min] = 1/(n+1). The intuition is that n draws cut the interval into n+1 gaps of equal expected length, so the minimum sits one gap in from 0 and the maximum one gap short of 1. The expected range is therefore (n−1)/(n+1).",
      "For discrete variables, work with the cumulative form and difference it. For dice, P(max ≤ k) = (k/6)ⁿ, so P(max = k) = (kⁿ − (k−1)ⁿ)/6ⁿ. With two dice that is the familiar (2k−1)/36, giving E[max] = 161/36 ≈ 4.47. By symmetry E[min] = 7 − E[max] ≈ 2.53 for two dice, since each face k pairs with 7 − k.",
      "The maximum and minimum are positively correlated, which surprises people: a sample that happens to sit high has both a high max and a high min. For two uniforms the correlation is exactly 1/2, and it decays toward zero as n grows because the max and min drift to opposite ends of the interval and stop informing each other.",
    ],
    keyIdeas: [
      {
        name: "Both extremes come from products",
        body: "P(max ≤ t) = F(t)ⁿ and P(min > t) = (1 − F(t))ⁿ. Everything else is differentiation or differencing.",
      },
      {
        name: "Uniform extremes",
        body: "For n iid U(0,1): E[max] = n/(n+1), E[min] = 1/(n+1), E[range] = (n−1)/(n+1). The n draws make n+1 equal expected gaps.",
      },
      {
        name: "Discrete maxima",
        body: "P(max = k) = (kⁿ − (k−1)ⁿ)/6ⁿ for n dice. Two dice give (2k−1)/36 and E[max] = 161/36.",
      },
      {
        name: "Max and min are positively correlated",
        body: "A high sample lifts both. For two uniforms ρ = 1/2, decaying toward 0 as n grows.",
      },
    ],
    checkYourself: [
      "Derive E[max] for n iid U(0,1) from P(max ≤ t) = tⁿ, and explain the n+1 gaps intuition.",
      "Why is E[min] = 7 − E[max] for two dice, and does that argument work for three?",
      "Why are the max and min positively correlated rather than negatively?",
    ],
    examples: [
      {
        id: "4.6-ex1",
        prompt:
          "Three numbers are drawn independently and uniformly from [0,1]. What is the expected value of the largest?",
        steps: [
          "Start from the cumulative distribution: the max is ≤ t exactly when all three draws are, so P(max ≤ t) = t³ for t in [0,1].",
          "Differentiate to get the density: f(t) = 3t².",
          "Then E[max] = ∫₀¹ t · 3t² dt = ∫₀¹ 3t³ dt = 3/4.",
          "Cross-check with the general result n/(n+1) = 3/4. ✓",
          "Sanity check the intuition: three draws create four gaps averaging 1/4 each, so the largest sits one gap below 1.",
        ],
        answer: "3/4",
        takeaway:
          "Always go via the cumulative distribution for extremes — the density of a max is awkward to write down directly but trivial to differentiate out of F(t)ⁿ. And n/(n+1) is worth knowing cold.",
      },
    ],
    problems: [
      {
        id: "4.6-p1",
        prompt:
          "Five numbers are drawn independently and uniformly from [0,1]. What is E[the largest]? (Decimal, 4 dp.)",
        answer: "0.8333",
        answerValue: 0.8333,
        tolerance: 0.005,
        gradingType: "numeric_tolerance",
        difficulty: 3,
        targetSeconds: 35,
        explanation:
          "E[max] = n/(n+1) = 5/6 ≈ 0.8333. Five draws divide [0,1] into six gaps of expected length 1/6 each, so the largest sits one gap short of 1.",
        hints: [
          { level: 1, text: "P(max ≤ t) = t⁵." },
          { level: 2, text: "There's a general formula in n for uniform draws." },
          { level: 3, text: "n/(n+1) with n = 5." },
        ],
      },
      {
        id: "4.6-p2",
        prompt:
          "Four numbers are drawn independently and uniformly from [0,1]. What is E[the smallest]? (Decimal, 2 dp.)",
        answer: "0.2",
        answerValue: 0.2,
        tolerance: 0.005,
        gradingType: "numeric_tolerance",
        difficulty: 3,
        targetSeconds: 30,
        explanation:
          "E[min] = 1/(n+1) = 1/5 = 0.2. It mirrors E[max] = 4/5 about the midpoint 1/2, which is the symmetry of replacing every draw x by 1 − x.",
        hints: [
          { level: 1, text: "Start from P(min > t) = (1 − t)⁴ — all four draws must clear t." },
          { level: 2, text: "The minimum mirrors the maximum about 1/2." },
          { level: 3, text: "Use the general result 1/(n+1) with n = 4." },
        ],
      },
      {
        id: "4.6-p3",
        prompt:
          "Three numbers are drawn independently and uniformly from [0,1]. What is the expected difference between the largest and the smallest? (Decimal, 2 dp.)",
        answer: "0.5",
        answerValue: 0.5,
        tolerance: 0.005,
        gradingType: "numeric_tolerance",
        difficulty: 3,
        targetSeconds: 35,
        explanation:
          "Linearity: E[max − min] = 3/4 − 1/4 = 1/2. In general (n−1)/(n+1), which tends to 1 as the sample grows.",
        hints: [
          { level: 1, text: "Expectation is linear, so handle the two extremes separately." },
          { level: 2, text: "E[max] = n/(n+1) and E[min] = 1/(n+1)." },
          { level: 3, text: "Subtract the two expectations: E[max] − E[min] = 3/4 − 1/4." },
        ],
      },
      {
        id: "4.6-p4",
        prompt:
          "Two fair dice are rolled. What is the expected value of the larger face (taking the value itself if they tie)? (Decimal, 4 dp.)",
        answer: "4.4722",
        answerValue: 4.4722,
        tolerance: 0.005,
        gradingType: "numeric_tolerance",
        difficulty: 4,
        targetSeconds: 65,
        explanation:
          "P(max = k) = (k² − (k−1)²)/36 = (2k−1)/36. So E = Σ k(2k−1)/36 = (1+6+15+28+45+66)/36 = 161/36 ≈ 4.4722. Note it sits well above 3.5 — taking the better of two draws is worth about a full pip.",
        hints: [
          { level: 1, text: "Get P(max ≤ k) first; it's a clean square." },
          { level: 2, text: "P(max = k) = P(max ≤ k) − P(max ≤ k−1) = (2k−1)/36." },
          { level: 3, text: "Σ k(2k−1)/36 = 161/36." },
        ],
      },
      {
        id: "4.6-p5",
        prompt:
          "Two numbers are drawn independently and uniformly from [0,1]. What is P(the larger is below 0.6)? (Decimal, 2 dp.)",
        answer: "0.36",
        answerValue: 0.36,
        tolerance: 0.005,
        gradingType: "numeric_tolerance",
        difficulty: 2,
        targetSeconds: 25,
        explanation:
          "The maximum is below 0.6 exactly when both draws are, and they are independent, so 0.6² = 0.36. This is the cumulative distribution of the max, F(t)ⁿ, evaluated at t = 0.6 with n = 2.",
        hints: [
          { level: 1, text: "'The largest is below t' says something about every draw." },
          { level: 2, text: "Both must be below 0.6, and they're independent." },
          { level: 3, text: "Both draws must be below 0.6, and they are independent: 0.6²." },
        ],
      },
      {
        id: "4.6-p6",
        prompt:
          "Two fair dice are rolled. What is the expected value of the smaller face (taking the value itself if they tie)? (Decimal, 4 dp.)",
        answer: "2.5278",
        answerValue: 2.5278,
        tolerance: 0.005,
        gradingType: "numeric_tolerance",
        difficulty: 4,
        targetSeconds: 55,
        explanation:
          "Symmetry does it in one line: replacing every face k by 7 − k turns the min into the max, so E[min] = 7 − E[max] = 7 − 161/36 = 91/36 ≈ 2.5278. Check: E[max] + E[min] must equal E[sum] = 7. ✓",
        hints: [
          { level: 1, text: "You already know E[max]. Is there a relationship you can exploit?" },
          { level: 2, text: "The max and the min together are just the two dice, so their expectations sum to 7." },
          { level: 3, text: "The max and min sum to the two dice, so E[min] = 7 − E[max] = 7 − 161/36." },
        ],
      },
    ],
    bookProblems: [
      { id: "4.6-b1", title: "Expected value of max and min", page: 99 },
      { id: "4.6-b2", title: "Correlation of max and min", page: 100 },
      { id: "4.6-b3", title: "Random ants", page: 102 },
    ],
  },
];
