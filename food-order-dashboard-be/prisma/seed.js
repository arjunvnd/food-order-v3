"use strict";
/**
 * Bootstrap seed — run once to set up the first SUPER_ADMIN and a Mall.
 *
 * Usage:
 *   1. Log in to the app at least once with your Auth0 account so your user
 *      record exists in the database (the /auth/sync call creates it).
 *   2. Set the environment variable SEED_SUPER_ADMIN_EMAIL to your email.
 *   3. Run: npx prisma db seed
 *
 * Example:
 *   $env:SEED_SUPER_ADMIN_EMAIL="you@example.com" ; $env:SEED_MALL_NAME="Grand Mall" ; npx prisma db seed
 *
 * If SEED_MALL_NAME is not provided, it defaults to "Main Mall".
 * The script is idempotent — safe to run multiple times.
 */
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("../src/generated/prisma/client/client");
const adapter = new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    const email = process.env.SEED_SUPER_ADMIN_EMAIL;
    const auth0Sub = process.env.SEED_SUPER_ADMIN_AUTH0_SUB;
    if (!email && !auth0Sub) {
        console.error('❌  Set SEED_SUPER_ADMIN_EMAIL or SEED_SUPER_ADMIN_AUTH0_SUB before running the seed.');
        process.exit(1);
    }
    const mallName = process.env.SEED_MALL_NAME ?? 'Main Mall';
    const mallAddress = process.env.SEED_MALL_ADDRESS ?? '123 Main Street';
    // 1. Promote the user to SUPER_ADMIN (they must have logged in at least once)
    const user = auth0Sub
        ? await prisma.user.findUnique({ where: { auth0Sub } })
        : await prisma.user.findUnique({ where: { email: email } });
    if (!user) {
        const lookup = auth0Sub ? `auth0Sub "${auth0Sub}"` : `email "${email}"`;
        console.error(`❌  No user found with ${lookup}.\n` +
            '    Log in to the app at least once first so /auth/sync creates the record.\n' +
            '    Tip: if the email column stored your auth0Sub (e.g. auth0|xxx), set SEED_SUPER_ADMIN_AUTH0_SUB instead.');
        process.exit(1);
    }
    await prisma.user.update({
        where: { email },
        data: { role: 'SUPER_ADMIN' },
    });
    console.log(`✅  Promoted ${email} to SUPER_ADMIN`);
    // 2. Create a Mall (skip if one already exists with the same name)
    const existing = await prisma.mall.findFirst({ where: { name: mallName } });
    if (existing) {
        console.log(`ℹ️   Mall "${mallName}" already exists (id: ${existing.id}) — skipped`);
    }
    else {
        const mall = await prisma.mall.create({
            data: { name: mallName, address: mallAddress },
        });
        console.log(`✅  Created mall "${mall.name}" (id: ${mall.id})`);
        console.log('\n📋  Next steps:\n' +
            `    1. Log out and log back in — your role will now be SUPER_ADMIN.\n` +
            `    2. Call POST /api/super-admin/malls/${mall.id}/admins to assign an admin to this mall.\n` +
            `    3. That admin can then invite vendors from the dashboard.`);
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
