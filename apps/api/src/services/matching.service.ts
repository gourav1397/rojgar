export function computeMatchScore(input: {
  candidateSkills: string[];
  jobSkills: string[];
  candidateCity?: string | null;
  jobCity: string;
  expectedSalary?: number | null;
  maxSalary?: number | null;
}) {
  const candidateSkills = new Set(input.candidateSkills.map(skill => skill.toLowerCase()));
  const matchedSkills = input.jobSkills.filter(skill => candidateSkills.has(skill.toLowerCase())).length;
  const skillScore = input.jobSkills.length ? (matchedSkills / input.jobSkills.length) * 70 : 25;
  const cityScore = input.candidateCity && input.candidateCity.toLowerCase() === input.jobCity.toLowerCase() ? 20 : 0;
  const salaryScore = input.expectedSalary && input.maxSalary && input.expectedSalary <= input.maxSalary ? 10 : 0;
  return Math.round(skillScore + cityScore + salaryScore);
}
