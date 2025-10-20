/**
 * Optimiseur d'images avec Sharp
 * Compression, redimensionnement, conversion de format
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class ImageOptimizer {
  constructor(options = {}) {
    this.defaultQuality = options.quality || 85;
    this.maxWidth = options.maxWidth || 1920;
    this.maxHeight = options.maxHeight || 1080;
    this.defaultFormat = options.format || 'png';
  }

  /**
   * Optimiser une image depuis un buffer
   */
  async optimize(imageBuffer, options = {}) {
    const {
      format = this.defaultFormat,
      quality = this.defaultQuality,
      maxWidth = this.maxWidth,
      maxHeight = this.maxHeight,
      fit = 'inside', // inside, cover, contain, fill, outside
      withoutEnlargement = true
    } = options;

    try {
      // Obtenir les métadonnées de l'image
      const metadata = await sharp(imageBuffer).metadata();
      
      console.log(`🖼️  Image originale: ${metadata.width}x${metadata.height} (${metadata.format})`);

      // Optimiser l'image
      const optimizedBuffer = await sharp(imageBuffer)
        .resize(maxWidth, maxHeight, {
          fit,
          withoutEnlargement
        })
        .toFormat(format, { quality })
        .toBuffer();

      // Obtenir les nouvelles métadonnées
      const newMetadata = await sharp(optimizedBuffer).metadata();
      const compressionRatio = ((1 - optimizedBuffer.length / imageBuffer.length) * 100).toFixed(1);

      console.log(`✨ Image optimisée: ${newMetadata.width}x${newMetadata.height} (${format})`);
      console.log(`📉 Compression: ${compressionRatio}% (${this.formatBytes(imageBuffer.length)} → ${this.formatBytes(optimizedBuffer.length)})`);

      return {
        buffer: optimizedBuffer,
        metadata: newMetadata,
        originalSize: imageBuffer.length,
        optimizedSize: optimizedBuffer.length,
        compressionRatio: parseFloat(compressionRatio)
      };

    } catch (error) {
      console.error('❌ Erreur optimisation image:', error.message);
      throw error;
    }
  }

  /**
   * Optimiser et sauvegarder une image
   */
  async optimizeAndSave(imageBuffer, outputPath, options = {}) {
    try {
      const result = await this.optimize(imageBuffer, options);
      
      // S'assurer que le dossier de sortie existe
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Sauvegarder l'image optimisée
      fs.writeFileSync(outputPath, result.buffer);
      
      console.log(`💾 Image sauvegardée: ${outputPath}`);

      return {
        ...result,
        path: outputPath,
        filename: path.basename(outputPath)
      };

    } catch (error) {
      console.error('❌ Erreur sauvegarde image:', error.message);
      throw error;
    }
  }

  /**
   * Créer des variantes responsive d'une image
   */
  async createResponsiveVariants(imageBuffer, baseOutputPath, options = {}) {
    const {
      format = this.defaultFormat,
      quality = this.defaultQuality,
      sizes = [
        { width: 1920, suffix: 'xl' },
        { width: 1280, suffix: 'lg' },
        { width: 640, suffix: 'md' },
        { width: 320, suffix: 'sm' }
      ]
    } = options;

    const variants = [];

    try {
      for (const size of sizes) {
        const outputPath = baseOutputPath.replace(
          `.${format}`,
          `-${size.suffix}.${format}`
        );

        const result = await this.optimizeAndSave(imageBuffer, outputPath, {
          format,
          quality,
          maxWidth: size.width,
          maxHeight: Math.round(size.width * 9 / 16) // Ratio 16:9
        });

        variants.push({
          size: size.suffix,
          width: result.metadata.width,
          height: result.metadata.height,
          path: result.path,
          filename: result.filename,
          sizeBytes: result.optimizedSize
        });
      }

      console.log(`✅ ${variants.length} variantes responsive créées`);

      return variants;

    } catch (error) {
      console.error('❌ Erreur création variantes:', error.message);
      throw error;
    }
  }

  /**
   * Convertir une image en WebP (format moderne)
   */
  async convertToWebP(imageBuffer, quality = 85) {
    try {
      const webpBuffer = await sharp(imageBuffer)
        .webp({ quality })
        .toBuffer();

      const compressionRatio = ((1 - webpBuffer.length / imageBuffer.length) * 100).toFixed(1);
      
      console.log(`🔄 Converti en WebP: ${compressionRatio}% de compression`);

      return webpBuffer;

    } catch (error) {
      console.error('❌ Erreur conversion WebP:', error.message);
      throw error;
    }
  }

  /**
   * Obtenir les métadonnées d'une image
   */
  async getMetadata(imageBuffer) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      return metadata;
    } catch (error) {
      console.error('❌ Erreur récupération métadonnées:', error.message);
      throw error;
    }
  }

  /**
   * Formater les bytes en format lisible
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Valider qu'un buffer est une image valide
   */
  async validateImage(imageBuffer) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Image invalide: dimensions manquantes');
      }

      if (metadata.width < 100 || metadata.height < 100) {
        throw new Error('Image trop petite (min 100x100)');
      }

      return true;

    } catch (error) {
      console.error('❌ Validation image échouée:', error.message);
      return false;
    }
  }
}

// Instance globale
const imageOptimizer = new ImageOptimizer();

module.exports = {
  ImageOptimizer,
  imageOptimizer
};
