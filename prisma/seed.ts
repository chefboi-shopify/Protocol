import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const HOUR = 3_600_000;

async function main() {
  await prisma.debrief.deleteMany();
  await prisma.message.deleteMany();
  await prisma.match.deleteMany();
  await prisma.endorsement.deleteMany();
  await prisma.pass.deleteMany();
  await prisma.user.deleteMany();

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Operator", age: 28, gender: "M", interestedIn: "F",
        fiscalArchetype: "The Architect", attachmentStyle: "Secure", socialBattery: "Ambivert", lifePace: "Fast & Driven",
        reliabilityScore: 98, locationCity: "San Francisco, CA", subscriptionStatus: "ACTIVE",
        religion: "Not Religious", politicalLeaning: "Moderate", kidsPreference: "Open to Kids",
        targetReligion: "", targetPolitical: "", targetKids: "Wants Kids,Open to Kids,Not Sure Yet",
        targetMinAge: 28, targetMaxAge: 35,
        targetArchetypes: "The Architect,The Minimalist,The Builder,The Experientialist",
        targetAttachment: "", targetSocialBattery: "", targetLifePace: "",
        dealbreakers: "", strongPreferences: "Heavy Drinker", tags: "Remote Worker,Night Owl",
        videoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop",
      },
    }),
    prisma.user.create({
      data: {
        name: "Morgan", age: 28, gender: "F", interestedIn: "M",
        fiscalArchetype: "The Minimalist", attachmentStyle: "Secure", socialBattery: "Introvert", lifePace: "Balanced",
        reliabilityScore: 94, locationCity: "San Francisco, CA", subscriptionStatus: "ACTIVE",
        religion: "Spiritual", politicalLeaning: "Liberal", kidsPreference: "Wants Kids",
        targetReligion: "Not Religious,Spiritual", targetPolitical: "Liberal,Moderate", targetKids: "Wants Kids,Open to Kids",
        targetMinAge: 28, targetMaxAge: 34,
        targetArchetypes: "The Architect,The Builder",
        targetAttachment: "Secure,Evolving", targetSocialBattery: "", targetLifePace: "",
        dealbreakers: "Smoking", strongPreferences: "", tags: "Non-Drinker,Early Riser",
        videoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop",
      },
    }),
    prisma.user.create({
      data: {
        name: "Jordan", age: 31, gender: "F", interestedIn: "M",
        fiscalArchetype: "The Builder", attachmentStyle: "Anxious", socialBattery: "Extrovert", lifePace: "Fast & Driven",
        reliabilityScore: 87, locationCity: "San Francisco, CA", subscriptionStatus: "ACTIVE",
        religion: "Christian", politicalLeaning: "Moderate", kidsPreference: "Wants Kids",
        targetReligion: "", targetPolitical: "Moderate,Conservative", targetKids: "Wants Kids,Open to Kids",
        targetMinAge: 28, targetMaxAge: 36,
        targetArchetypes: "The Architect,The Experientialist",
        targetAttachment: "", targetSocialBattery: "Ambivert,Extrovert", targetLifePace: "Balanced,Fast & Driven",
        dealbreakers: "Heavy Drinker", strongPreferences: "", tags: "Early Riser",
        videoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop",
      },
    }),
    prisma.user.create({
      data: {
        name: "Avery", age: 28, gender: "F", interestedIn: "ALL",
        fiscalArchetype: "The Experientialist", attachmentStyle: "Evolving", socialBattery: "Ambivert", lifePace: "Balanced",
        reliabilityScore: 91, locationCity: "Oakland, CA", subscriptionStatus: "ACTIVE",
        religion: "Not Religious", politicalLeaning: "Liberal", kidsPreference: "Not Sure Yet",
        targetReligion: "Not Religious,Spiritual", targetPolitical: "", targetKids: "",
        targetMinAge: 28, targetMaxAge: 33,
        targetArchetypes: "The Architect,The Minimalist,The Builder,The Experientialist",
        targetAttachment: "", targetSocialBattery: "", targetLifePace: "",
        dealbreakers: "", strongPreferences: "Smoking", tags: "Vegan,Night Owl",
        videoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop",
      },
    }),
    prisma.user.create({
      data: {
        name: "Riley", age: 30, gender: "F", interestedIn: "M",
        fiscalArchetype: "The Architect", attachmentStyle: "Avoidant", socialBattery: "Introvert", lifePace: "Slow & Steady",
        reliabilityScore: 96, locationCity: "San Francisco, CA", subscriptionStatus: "ACTIVE",
        religion: "Spiritual", politicalLeaning: "Moderate", kidsPreference: "Open to Kids",
        targetReligion: "", targetPolitical: "Liberal,Moderate", targetKids: "Wants Kids,Open to Kids,Not Sure Yet",
        targetMinAge: 28, targetMaxAge: 35,
        targetArchetypes: "The Architect,The Builder",
        targetAttachment: "Secure,Avoidant", targetSocialBattery: "Introvert,Ambivert", targetLifePace: "",
        dealbreakers: "", strongPreferences: "", tags: "Remote Worker",
        videoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop",
      },
    }),
    prisma.user.create({
      data: {
        name: "Quinn", age: 29, gender: "NB", interestedIn: "ALL",
        fiscalArchetype: "The Builder", attachmentStyle: "Evolving", socialBattery: "Ambivert", lifePace: "Balanced",
        reliabilityScore: 82, locationCity: "Berkeley, CA", subscriptionStatus: "ACTIVE",
        religion: "Buddhist", politicalLeaning: "Liberal", kidsPreference: "Doesn't Want Kids",
        targetReligion: "", targetPolitical: "", targetKids: "",
        targetMinAge: 28, targetMaxAge: 40,
        targetArchetypes: "The Architect,The Minimalist,The Builder,The Experientialist",
        targetAttachment: "", targetSocialBattery: "", targetLifePace: "",
        dealbreakers: "", strongPreferences: "", tags: "Smoking",
        videoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop",
      },
    }),
    prisma.user.create({
      data: {
        name: "Sage", age: 33, gender: "F", interestedIn: "M",
        fiscalArchetype: "The Builder", attachmentStyle: "Secure", socialBattery: "Extrovert", lifePace: "Slow & Steady",
        reliabilityScore: 100, locationCity: "San Jose, CA", subscriptionStatus: "ACTIVE",
        religion: "Catholic", politicalLeaning: "Conservative", kidsPreference: "Wants Kids",
        targetReligion: "Christian,Catholic", targetPolitical: "Moderate,Conservative", targetKids: "Wants Kids,Open to Kids",
        targetMinAge: 28, targetMaxAge: 38,
        targetArchetypes: "The Architect,The Builder",
        targetAttachment: "Secure", targetSocialBattery: "", targetLifePace: "Slow & Steady,Balanced",
        dealbreakers: "Smoking,Heavy Drinker", strongPreferences: "", tags: "Early Riser",
        videoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop",
      },
    }),
  ]);

  const [operator, , jordan, , riley, quinn] = users;
  const now = Date.now();

  const match1 = await prisma.match.create({ data: { user1Id: operator.id, user2Id: jordan.id, status: "ACTIVE", expiresAt: new Date(now + 118 * HOUR) } });
  const match2 = await prisma.match.create({ data: { user1Id: operator.id, user2Id: riley.id, status: "ACTIVE", expiresAt: new Date(now + 42 * HOUR) } });
  const match3 = await prisma.match.create({ data: { user1Id: quinn.id, user2Id: operator.id, status: "ACTIVE", expiresAt: new Date(now + 6 * HOUR) } });

  await prisma.message.createMany({
    data: [
      { matchId: match1.id, senderId: jordan.id, content: "Hey, saw your profile. Tuesday work for you?" },
      { matchId: match1.id, senderId: operator.id, content: "Tuesday works. Coffee somewhere central?" },
      { matchId: match2.id, senderId: operator.id, content: "Coffee or a walk?" },
      { matchId: match2.id, senderId: riley.id, content: "Coffee. 20 min. Thursday 6pm." },
      { matchId: match2.id, senderId: operator.id, content: "Done." },
      { matchId: match2.id, senderId: riley.id, content: "Sending you the spot now." },
      { matchId: match2.id, senderId: operator.id, content: "Got it. See you there." },
      { matchId: match2.id, senderId: riley.id, content: "Looking forward to it." },
      { matchId: match3.id, senderId: quinn.id, content: "We should figure out a time soon." },
    ],
  });

  console.log(`Seeded ${users.length} users, 3 matches, 9 messages`);
  console.log(`\nOperator ID: ${operator.id}`);
  console.log("Cookie: protocol-user-id = " + operator.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
