import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Recipe } from '../domain/model/recipe.entity';
import { Ingredient } from '../domain/model/ingredient.entity';

export interface RecipePdfLabels {
  extractionMethod: string;
  cupping: string;
  grind: string;
  ratio: string;
  time: string;
  ingredients: string;
  steps: string;
  tips: string;
  createdAt: string;
  ingredientName: string;
  amount: string;
}

@Injectable({ providedIn: 'root' })
export class RecipePdfService {
  async downloadPdf(recipe: Recipe, ingredients: Ingredient[], labels: RecipePdfLabels): Promise<void> {
    const doc = await this.generateDoc(recipe, ingredients, labels);
    doc.save(`${this.sanitizeFileName(recipe.name)}.pdf`);
  }

  private async generateDoc(
    recipe: Recipe,
    ingredients: Ingredient[],
    labels: RecipePdfLabels,
  ): Promise<jsPDF> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    const imageData = await this.loadImageAsDataUrl(recipe.imageUrl);
    if (imageData) {
      const imageProps = this.getScaledImageSize(doc, imageData, contentWidth, 70);
      const imageX = margin + (contentWidth - imageProps.width) / 2;
      doc.addImage(imageData, imageProps.format, imageX, y, imageProps.width, imageProps.height);
      y += imageProps.height + 12;
    }

    doc.setFontSize(20);
    doc.setTextColor(0);
    doc.text(recipe.name, margin, y);
    y += 12;

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(labels.extractionMethod, margin, y);
    doc.setTextColor(0);
    y += 12;

    const infoItems: [string, string][] = [];
    if (recipe.cupping) infoItems.push([labels.cupping, recipe.cupping]);
    if (recipe.grindSize) infoItems.push([labels.grind, recipe.grindSize]);
    if (recipe.ratio) infoItems.push([labels.ratio, recipe.ratio]);
    if (recipe.preparationTime != null) {
      infoItems.push([labels.time, String(recipe.preparationTime)]);
    }

    infoItems.forEach(([label, value]) => {
      y = this.ensureSpace(doc, y, 8);
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 45, y);
      y += 8;
    });

    if (ingredients.length) {
      y = this.ensureSpace(doc, y, 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(labels.ingredients, margin, y);
      doc.setFontSize(11);
      y += 6;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [[labels.ingredientName, labels.amount]],
        body: ingredients.map((ingredient) => [
          ingredient.name,
          `${ingredient.amount} ${ingredient.unit}`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [65, 69, 53] },
      });

      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }

    if (recipe.steps) {
      y = this.addSection(doc, labels.steps, recipe.steps, margin, y, contentWidth);
    }

    if (recipe.tips) {
      y = this.addSection(doc, labels.tips, recipe.tips, margin, y, contentWidth);
    }

    y = this.ensureSpace(doc, y, 10);
    doc.setFontSize(9);
    doc.setTextColor(120);
    const createdLabel = `${labels.createdAt}: ${new Date(recipe.createdAt).toLocaleDateString()}`;
    doc.text(createdLabel, margin, y);

    return doc;
  }

  private async loadImageAsDataUrl(url: string): Promise<string | null> {
    if (!url?.trim()) return null;

    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const blob = await response.blob();
      return await this.blobToDataUrl(blob);
    } catch {
      return this.loadImageViaCanvas(url);
    }
  }

  private loadImageViaCanvas(url: string): Promise<string | null> {
    return new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const context = canvas.getContext('2d');
          if (!context) {
            resolve(null);
            return;
          }
          context.drawImage(image, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.92));
        } catch {
          resolve(null);
        }
      };
      image.onerror = () => resolve(null);
      image.src = url;
    });
  }

  private getScaledImageSize(
    doc: jsPDF,
    dataUrl: string,
    maxWidth: number,
    maxHeight: number,
  ): { width: number; height: number; format: 'JPEG' | 'PNG' } {
    const format = dataUrl.includes('image/png') ? 'PNG' : 'JPEG';
    const properties = doc.getImageProperties(dataUrl);
    const widthRatio = maxWidth / properties.width;
    const heightRatio = maxHeight / properties.height;
    const ratio = Math.min(widthRatio, heightRatio, 1);

    return {
      width: properties.width * ratio,
      height: properties.height * ratio,
      format,
    };
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private addSection(
    doc: jsPDF,
    title: string,
    content: string,
    margin: number,
    y: number,
    maxWidth: number,
  ): number {
    y = this.ensureSpace(doc, y, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text(title, margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(content, maxWidth);
    lines.forEach((line: string) => {
      y = this.ensureSpace(doc, y, 7);
      doc.text(line, margin, y);
      y += 7;
    });

    return y + 4;
  }

  private ensureSpace(doc: jsPDF, y: number, needed: number): number {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + needed > pageHeight - 20) {
      doc.addPage();
      return 20;
    }
    return y;
  }

  private sanitizeFileName(name: string): string {
    return name.trim().replace(/[<>:"/\\|?*]+/g, '-').replace(/\s+/g, '-') || 'recipe';
  }
}
