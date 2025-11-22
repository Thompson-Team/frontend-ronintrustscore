import { Question } from '@/types/questionnaire';

export const questions: Question[] = [
  {
    id: 'q1_purpose',
    question: 'What will you use this Ronin account for?',
    type: 'multiselect',
    options: [
      'Play',
      'Trade or sell items',
      'Interact with dApps',
      'General personal use',
      'Other'
    ]
  },
  {
    id: 'q2_accounts',
    question: 'How many Ronin accounts have you had before?',
    type: 'multiple',
    options: [
      'This is my first one',
      'Between 2 and 5',
      'More than 5'
    ]
  },
  {
    id: 'q3_behavior',
    question: 'How would you describe your behavior in online communities or games?',
    type: 'text',
    placeholder: 'Write your answer here...'
  },
  {
    id: 'q4_sanctions',
    question: 'Have you ever received reports or penalties in games?',
    type: 'multiple',
    options: [
      'No, never',
      'Yes, minor ones (chat, AFK)',
      'Yes, moderate ones (toxic behavior, leaving games)',
      'Yes, severe ones (multi-accounting, cheating, scams)'
    ]
  },
  {
    id: 'q5_conflict',
    question: 'In a conflict situation with other players, you generally…',
    type: 'multiple',
    options: [
      'Try to resolve it by talking',
      'Ignore the conflict',
      'Seek help from a moderator',
      'React strongly / get upset easily'
    ]
  },
  {
    id: 'q6_agreements',
    question: 'When making agreements with other players (e.g., trades), your track record is…',
    type: 'multiple',
    options: [
      'I always follow through',
      'I almost always follow through',
      'I had issues sometimes',
      'I don’t usually make trades'
    ]
  },
  {
    id: 'q7_risky_practices',
    question: 'Have you ever engaged in risky practices (sharing passwords, wallets, using bots)?',
    type: 'multiple',
    options: [
      'Never',
      'Very rarely',
      'Several times',
      'Yes, frequently'
    ]
  },
  {
    id: 'q8_security',
    question: 'How responsible would you say you are with the security of your assets?',
    type: 'multiple',
    options: [
      'Very responsible',
      'Responsible',
      'A bit careless',
      'Not responsible at all'
    ]
  },
  {
    id: 'q9_experience',
    question: 'What is your level of experience in Web3?',
    type: 'multiple',
    options: [
      'Beginner',
      'Intermediate',
      'Advanced'
    ]
  },
  {
    id: 'q10_education',
    question: 'Have you received education or watched content about Web3 security?',
    type: 'multiple',
    options: [
      'Yes, a lot',
      'A little',
      'Almost none',
      'None'
    ]
  },
  {
    id: 'q11_importance',
    question: 'Why do you think having a verifiable reputation in Web3 is important?',
    type: 'text',
    placeholder: 'Share your opinion...'
  },
  {
    id: 'q12_trustworthy_experience',
    question: 'Describe an experience where you proved to be trustworthy or acted in good faith.',
    type: 'text',
    placeholder: 'Describe your experience...'
  },
  {
    id: 'q13_scam_response',
    question: 'What would you do if someone tried to scam you or compromise your wallet?',
    type: 'text',
    placeholder: 'Describe your response...'
  },
  {
    id: 'q14_values',
    question: 'What values represent you when interacting with other players or users?',
    type: 'text',
    placeholder: 'List your values...'
  },
  {
    id: 'q15_self_rating',
    question: 'How would you rate your trustworthiness from 1 to 10?',
    type: 'number',
    placeholder: 'Number from 1 to 10'
  },
  {
    id: 'q16_reevaluation',
    question: 'Are you willing to re-evaluate yourself in the future to improve your score?',
    type: 'multiple',
    options: [
      'Yes',
      'No',
      'Not sure'
    ]
  }
];
