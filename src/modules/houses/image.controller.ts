import { Elysia, t } from 'elysia';
import { eq } from 'drizzle-orm';
import { db } from '../../db/connection';
import { houses } from '../../db/schema';
import { uploadImage, deleteImage } from '../../lib/cloudinary';

export const houseImageController = new Elysia({ prefix: '/houses/:id/image' })
  .put(
    "/",
    async ({ params, body, set }) => {
      const [existing] = await db
        .select({ id: houses.id, imagePublicId: houses.imagePublicId })
        .from(houses)
        .where(eq(houses.id, params.id));

      if (!existing) {
        set.status = 404;
        return {
          success: false,
          message: "House not found"
        };
      }

      const uploaded = await uploadImage(body.file, `houses/${params.id}`);

      let updated;
      try {
        [updated] = await db
          .update(houses)
          .set({
            imageUrl: uploaded.secure_url,
            imagePublicId: uploaded.public_id,
          })
          .where(eq(houses.id, params.id))
          .returning();
      } catch (error) {
        await deleteImage(uploaded.public_id).catch(console.error);
        throw error;
      }

      if (existing.imagePublicId) {
        await deleteImage(existing.imagePublicId).catch(console.error);
      }

      return updated;
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        file: t.File({
          type: ["image/jpeg", "image/png", "image/webp"],
          maxSize: "5m",
        }),
      }),
    }
  )

  .delete(
    "/",
    async ({ params, set }) => {
      const [existing] = await db
        .select({ imagePublicId: houses.imagePublicId })
        .from(houses)
        .where(eq(houses.id, params.id));

      if (!existing) {
        set.status = 404;
        return {
          success: false,
          message: "House not found"
        };
      }

      if (!existing.imagePublicId) {
        return {
          success: false,
          message: "This house doesn't have any images yet"
        };
      }

      await db
        .update(houses)
        .set({ imageUrl: null, imagePublicId: null })
        .where(eq(houses.id, params.id));

      await deleteImage(existing.imagePublicId).catch(console.error);

      return {
        success: true,
        message: 'Image deleted successfully'
      }
    }, 
    { params: t.Object({ id: t.Numeric() }) }
  );