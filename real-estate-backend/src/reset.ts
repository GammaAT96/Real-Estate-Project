import prisma from "./config/prisma.js";
import bcrypt from "bcryptjs";

/**
 * Reset script — clears ALL data except re-creates the superadmin user.
 * Run with: npx ts-node src/reset.ts   OR   npm run reset (if script added to package.json)
 *
 * Deletion order respects FK constraints:
 *   RefreshTokens → Sales → Bookings → Plots → Projects → Users → Companies
 */
async function reset() {
    console.log("🗑️  Starting database reset...\n");

    // 1. Refresh tokens first (no dependents)
    const { count: rt } = await prisma.refreshToken.deleteMany({});
    console.log(`✓ Deleted ${rt} refresh token(s)`);

    // 2. Sales
    const { count: sa } = await prisma.sale.deleteMany({});
    console.log(`✓ Deleted ${sa} sale(s)`);

    // 3. Bookings
    const { count: bk } = await prisma.booking.deleteMany({});
    console.log(`✓ Deleted ${bk} booking(s)`);

    // 4. Plots
    const { count: pl } = await prisma.plot.deleteMany({});
    console.log(`✓ Deleted ${pl} plot(s)`);

    // 5. Projects
    const { count: pr } = await prisma.project.deleteMany({});
    console.log(`✓ Deleted ${pr} project(s)`);

    // 6. All users
    const { count: us } = await prisma.user.deleteMany({});
    console.log(`✓ Deleted ${us} user(s)`);

    // 7. Companies
    const { count: co } = await prisma.company.deleteMany({});
    console.log(`✓ Deleted ${co} company(ies)`);

    // 8. Re-create the superadmin account
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
        data: {
            username: "superadmin",
            password: hashedPassword,
            role: "SUPER_ADMIN",
        },
    });

    console.log("\n✅ Database reset complete!");
    console.log("👤 Superadmin restored → username: superadmin | password: admin123");
}

reset()
    .catch((err) => {
        console.error("❌ Reset failed:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
