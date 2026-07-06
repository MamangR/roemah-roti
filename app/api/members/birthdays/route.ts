import { prisma } from "@/lib/prisma";

// ─── GET /api/members/birthdays ───────────────────────────────────────────────
// Returns members whose birthday falls within the next 7 days.
export async function GET() {
  const allMembers = await prisma.member.findMany({
    select: {
      initials: true,
      name: true,
      birthday: true,
      birthdayInput: true,
    },
  });

  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  const birthdaysThisWeek = allMembers
    .filter((member) => {
      const birthday = new Date(`${member.birthdayInput}T00:00:00`);
      if (Number.isNaN(birthday.getTime())) {
        return false;
      }
      const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
      return thisYearBirthday >= start && thisYearBirthday <= end;
    })
    .map((member) => ({
      initials: member.initials,
      name: member.name,
      date: member.birthday,
    }));

  return Response.json(birthdaysThisWeek);
}
