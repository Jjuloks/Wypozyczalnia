import multer from "multer";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

export const uploadDodawanieSprzetu = upload.fields([
  { name: "zdjecia", maxCount: 10 },
  { name: "zdjecie", maxCount: 1 }
]);

export const uploadDodawanieZdjec = upload.fields([
  { name: "zdjecie", maxCount: 10 },
  { name: "zdjecia", maxCount: 10 }
]);

export function parsujEdycjeBezZdjec(req, res, next) {
  upload.none()(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: "Zdjecia sprzetu mozna zmieniac tylko przez add_photos albo delete_photos."
      });
    }

    return next();
  });
}

export const uploadPojedynczegoZdjecia = upload.single("zdjecie");
