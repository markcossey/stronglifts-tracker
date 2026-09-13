import type { LiftId } from './types'

export interface LiftTechnique {
  summary: string
  setup: string[]
  execution: string[]
  mistakes: string[]
}

export const LIFT_TECHNIQUE: Record<LiftId, LiftTechnique> = {
  squat: {
    summary: 'Sit back and down until your hip crease passes below the top of your knee, then stand back up.',
    setup: [
      'Bar on your rear shoulder muscles, just below the bony ridge at the top of your back.',
      'Hands just outside your shoulders, wrists straight, elbows down.',
      'Feet about shoulder-width, toes turned out roughly 30°.',
      'Take a big breath, brace your stomach, stand the bar out and step back twice.',
    ],
    execution: [
      'Break at the hips and knees together, sitting back as you go down.',
      'Push your knees out so they track over your toes.',
      'Keep your chest up, back flat and weight over mid-foot.',
      'Go below parallel, then drive back up through your whole foot.',
      'Stand tall with hips and knees locked, then breathe and repeat.',
    ],
    mistakes: [
      'Knees caving inwards on the way up.',
      'Heels lifting, or weight drifting onto your toes.',
      'Lower back rounding at the bottom.',
      'Cutting depth and stopping above parallel.',
    ],
  },
  bench: {
    summary: 'Press the bar from your mid-chest to straight arms, shoulder blades squeezed and feet planted.',
    setup: [
      'Lie with your eyes under the bar, feet flat on the floor.',
      'Grip about one and a half times shoulder-width, bar resting on the heel of your palm.',
      'Squeeze your shoulder blades together and down into the bench.',
      'Keep a natural arch in your lower back, hips on the bench.',
    ],
    execution: [
      'Unrack to straight arms with the bar over your shoulders.',
      'Lower to your mid-chest, elbows tucked around 45–75° from your sides.',
      'Touch your chest lightly without bouncing.',
      'Press up and slightly back towards your face until your elbows lock.',
    ],
    mistakes: [
      'Elbows flared straight out to the sides.',
      'Bouncing the bar off your chest.',
      'Hips lifting off the bench.',
      'Wrists bent back under the bar.',
    ],
  },
  row: {
    summary: 'Pull the bar from the floor to your lower chest with your torso near horizontal, then set it down.',
    setup: [
      'Feet about shoulder-width, bar over mid-foot.',
      'Hinge at the hips until your torso is close to parallel with the floor, knees slightly bent.',
      'Grip just outside your legs, back flat, head in line with your spine.',
      'Take a breath and brace before each rep.',
    ],
    execution: [
      'Pull the bar in a straight line to your lower chest or upper stomach.',
      'Lead with your elbows and squeeze your shoulder blades together.',
      'Hold your torso angle still — the bar moves, you don’t.',
      'Lower under control and rest the bar on the floor between reps.',
    ],
    mistakes: [
      'Standing your torso up to help the bar move.',
      'Jerking the weight with your lower back.',
      'Shrugging your shoulders instead of rowing.',
      'Rounding your back to reach the bar.',
    ],
  },
  ohp: {
    summary: 'Press the bar from your front shoulders to overhead, finishing with it above the middle of your feet.',
    setup: [
      'Bar resting on your front shoulders, hands just outside shoulder-width.',
      'Elbows slightly in front of the bar, wrists straight.',
      'Feet about hip-width, glutes and stomach tight.',
      'Take a breath and brace — your torso does the stabilising.',
    ],
    execution: [
      'Move your head back slightly so the bar can travel past your face.',
      'Press up and a little backwards, not around your face.',
      'As the bar clears your forehead, push your head through so it ends under the bar.',
      'Lock your elbows with the bar over mid-foot, then lower to your shoulders.',
    ],
    mistakes: [
      'Leaning back and turning it into an incline press.',
      'Bending your knees to drive the bar up.',
      'Bar pressed forward, ending in front of your face.',
      'Stopping short of locked elbows.',
    ],
  },
  deadlift: {
    summary: 'Lift the bar from the floor to standing in one motion with a flat back, then set it back down.',
    setup: [
      'Bar over mid-foot, roughly an inch from your shins.',
      'Feet about hip-width, grip just outside your legs.',
      'Drop your hips until your shins touch the bar, chest up, back flat.',
      'Pull the slack out of the bar before you lift.',
    ],
    execution: [
      'Push the floor away and drag the bar up your legs.',
      'Let your hips and shoulders rise together.',
      'Keep the bar in contact with your legs the whole way.',
      'Lock out by standing tall — hips and knees straight, no leaning back.',
      'Lower by pushing your hips back first, then bending your knees.',
    ],
    mistakes: [
      'Hips shooting up first, turning it into a stiff-leg pull.',
      'Bar drifting away from your shins.',
      'Lower back rounding off the floor.',
      'Jerking the bar instead of taking the slack out first.',
    ],
  },
}
