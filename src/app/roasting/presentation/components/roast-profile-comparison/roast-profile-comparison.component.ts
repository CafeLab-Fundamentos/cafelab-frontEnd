import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RoastProfileApi } from '../../../application/roast-profile.api';
import { RoastProfile } from '../../../domain/model/roast-profile.entity';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToolbarComponent } from '../../../../public/presentation/components/toolbar/toolbar.component';
import { MatToolbar } from '@angular/material/toolbar';
import { TranslateService } from '@ngx-translate/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forkJoin } from 'rxjs';
import { CoffeeLotApi } from '../../../../coffee-lot/application/coffee-lot.api';
import { SupplierApi } from '../../../../supplier/application/supplier.api';
import { InventoryApi } from '../../../../inventory/application/inventory.api';

@Component({
  selector: 'app-roast-profile-comparison',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslateModule, CommonModule, ToolbarComponent, MatToolbar],
  templateUrl: './roast-profile-comparison.component.html',
  styleUrl: './roast-profile-comparison.component.css'
})
export class RoastProfileComparisonComponent implements OnInit {
  @ViewChild('comparisonCanvas', { static: true }) comparisonCanvas!: ElementRef<HTMLCanvasElement>;

  profiles: RoastProfile[] = [];
  roastSelectors: string[] = ['', ''];

  constructor(
    private roastProfileApi: RoastProfileApi,
    private coffeeLotApi: CoffeeLotApi,
    private supplierApi: SupplierApi,
    private inventoryApi: InventoryApi,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.roastProfileApi.getAll()
      .subscribe(profiles => {
        this.profiles = profiles;
      });
  }

  addSelector(): void {
    if (this.roastSelectors.length < 4) {
      this.roastSelectors.push('');
    }
  }

  ngAfterViewChecked(): void {
    this.drawComparisonGraph();
  }

  drawComparisonGraph(): void {
    if (!this.comparisonCanvas) return;

    const canvas = this.comparisonCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 70;
    const graphWidth = canvas.width - padding * 2;
    const graphHeight = canvas.height - padding * 2;

    const selectedProfiles = this.roastSelectors
      .map(id => this.profiles.find(p => p.id === Number(id)))
      .filter(p => !!p) as RoastProfile[];

    if (selectedProfiles.length === 0) return;

    const durationMax = Math.max(...selectedProfiles.map(p => p.duration));
    const tempStartMin = Math.min(...selectedProfiles.map(p => p.tempStart));
    const tempEndMax = Math.max(...selectedProfiles.map(p => p.tempEnd));

    const timeToX = (t: number) => padding + (t / durationMax) * graphWidth;
    const tempToY = (temp: number) =>
      canvas.height - padding - ((temp - tempStartMin) / (tempEndMax - tempStartMin)) * graphHeight;

    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;

    const xSteps = 10;
    const ySteps = 10;

    for (let i = 0; i <= xSteps; i++) {
      const t = (i / xSteps) * durationMax;
      const x = timeToX(t);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvas.height - padding);
      ctx.stroke();
    }

    for (let i = 0; i <= ySteps; i++) {
      const temp = tempStartMin + (i / ySteps) * (tempEndMax - tempStartMin);
      const y = tempToY(temp);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(padding, padding);
    ctx.stroke();

    ctx.font = '14px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    for (let i = 0; i <= xSteps; i++) {
      const t = (i / xSteps) * durationMax;
      const x = timeToX(t);
      ctx.fillText(
        `${t.toFixed(1)} ${this.translate.instant('comparison.minutos')}`,
        x,
        canvas.height - padding + 20
      );
    }

    ctx.textAlign = 'right';
    for (let i = 0; i <= ySteps; i++) {
      const temp = tempStartMin + (i / ySteps) * (tempEndMax - tempStartMin);
      const y = tempToY(temp);
      ctx.fillText(
        `${temp.toFixed(0)} ${this.translate.instant('comparison.gradosCelsius')}`,
        padding - 10,
        y + 5
      );
    }

    ctx.textAlign = 'center';
    ctx.font = '18px Arial';
    ctx.fillText(
      this.translate.instant('comparison.graficoTitulo'),
      canvas.width / 2,
      padding / 2
    );

    const colors = ['#8e44ad', '#c0392b', '#2980b9', '#27ae60'];

    selectedProfiles.forEach((profile, index) => {
      ctx.strokeStyle = colors[index % colors.length];
      ctx.lineWidth = 3;
      ctx.beginPath();

      const steps = 100;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * profile.duration;
        const temp = profile.tempStart + (profile.tempEnd - profile.tempStart) * Math.log1p(t) / Math.log1p(profile.duration);
        const x = timeToX(t);
        const y = tempToY(temp);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    const legendX = canvas.width - padding - 200;
    const legendY = padding + 20;
    const lineHeight = 20;

    selectedProfiles.forEach((profile, index) => {
      ctx.strokeStyle = colors[index % colors.length];
      ctx.beginPath();
      ctx.moveTo(legendX, legendY + index * lineHeight);
      ctx.lineTo(legendX + 30, legendY + index * lineHeight);
      ctx.stroke();

      ctx.fillStyle = '#000';
      ctx.fillText(profile.name, legendX + 40, legendY + index * lineHeight + 5);
    });
  }

  generateInsightsReport(): void {


    const selectedProfiles = [...this.profiles];

    if(selectedProfiles.length===0){
      console.log("No profiles available");
      return;
    }
    const avg = (arr:number[]) => {

      if(arr.length===0){
        return 0;
      }
    
      return arr.reduce(
        (a,b)=>a+b,
        0
      ) / arr.length;
    
    };
  
    const avgDuration=
      avg(selectedProfiles.map(p=>p.duration));
  
    const avgTempStart=
      avg(selectedProfiles.map(p=>p.tempStart));
  
    const avgTempEnd=
      avg(selectedProfiles.map(p=>p.tempEnd));
  
    const avgAcidity=
      avg(selectedProfiles.map(p=>p.acidity));
  
    const avgSweetness=
      avg(selectedProfiles.map(p=>p.sweetness));
  
    const avgBody=
      avg(selectedProfiles.map(p=>p.body));
  
  
    const insights:string[]=[];
  
    const longRoasts=
      selectedProfiles.filter(
        p=>p.duration>avgDuration
      );
  
    const shortRoasts=
      selectedProfiles.filter(
        p=>p.duration<=avgDuration
      );
  
    const longSweet=
    avg(
      longRoasts.map(
        p=>p.sweetness
      )
    );
  
    const shortSweet=
      avg(
        shortRoasts.map(
          p=>p.sweetness
        )
      );
  
    if(longSweet>shortSweet){
  
      insights.push(
        'Longer roast durations appear associated with higher sweetness.'
      );
  
    }
  
  
    const highTemp=
      avg(
        selectedProfiles
        .filter(
          p=>p.tempEnd>avgTempEnd
        )
        .map(
          p=>p.acidity
        )
      );
  
    const lowTemp=
      avg(
        selectedProfiles
        .filter(
          p=>p.tempEnd<=avgTempEnd
        )
        .map(
          p=>p.acidity
        )
      );
  
    if(highTemp<lowTemp){
  
      insights.push(
        'Higher ending temperatures tend to reduce acidity.'
      );
  
    }
  
  
    const roastCounts:{[key:string]:number}={};
  
    selectedProfiles.forEach(p=>{
  
      roastCounts[p.type]=
        (roastCounts[p.type]||0)+1;
  
    });
  
    const mostCommon=
      Object.entries(roastCounts)
      .sort((a,b)=>b[1]-a[1])[0];
  
    if(mostCommon){
  
      insights.push(
        `Most roast profiles belong to ${mostCommon[0]} roasts.`
      );
  
    }
  
  
    const doc=
      new jsPDF();
  
    doc.setFontSize(20);
  
    doc.text(
      'Roast Insights Report',
      20,
      20
    );
  
    doc.setFontSize(12);
  
    doc.text(
      'Statistical Summary',
      20,
      35
    );
  
    doc.text(
      `Profiles analyzed: ${selectedProfiles.length}`,
      20,
      45
    );
  
    doc.text(
      `Avg Duration: ${avgDuration.toFixed(2)}`,
      20,
      55
    );
  
    doc.text(
      `Avg Temp Start: ${avgTempStart.toFixed(2)}`,
      20,
      65
    );
  
    doc.text(
      `Avg Temp End: ${avgTempEnd.toFixed(2)}`,
      20,
      75
    );
  
    doc.text(
      `Avg Acidity: ${avgAcidity.toFixed(2)}`,
      20,
      85
    );
  
    doc.text(
      `Avg Sweetness: ${avgSweetness.toFixed(2)}`,
      20,
      95
    );
  
    doc.text(
      `Avg Body: ${avgBody.toFixed(2)}`,
      20,
      105
    );
  
  
    doc.text(
      'Generated Insights',
      20,
      125
    );
  
    insights.forEach((i,index)=>{
  
      doc.text(
        `• ${i}`,
        25,
        135+(index*10)
      );
  
    });
  
  
    autoTable(doc,{
  
      startY:170,
  
      head:[[
        'Name',
        'Duration',
        'TempStart',
        'TempEnd',
        'Acidity',
        'Sweetness',
        'Body'
      ]],
  
      body:selectedProfiles.map(p=>([
        p.name,
        p.duration,
        p.tempStart,
        p.tempEnd,
        p.acidity,
        p.sweetness,
        p.body
      ]))
  
    });
  
    console.log("saving pdf...");
    console.log(doc);
    doc.save(
      'roast-insights-report.pdf'
    );
  
  }
  
  generateTraceabilityReport(): void {

    this.coffeeLotApi.getAll().subscribe(lots => {
  
      this.supplierApi.getAll().subscribe(suppliers => {
  
        this.roastProfileApi.getAll().subscribe(roasts => {
  
          const doc = new jsPDF();
  
          doc.setFontSize(20);
  
          doc.text(
            'Reporte de Trazabilidad del Café',
            20,
            20
          );
  
          let currentY = 35;
  
          lots.forEach((lot,index)=>{
  
            const supplier=
              suppliers.find(
                s=>s.id===lot.supplier_id
              );
  
            const relatedRoasts=
              roasts.filter(
                r=>r.lot===lot.id
              );
  
            doc.setFontSize(15);
  
            doc.text(
              `Lote ${index+1}: ${lot.lot_name}`,
              20,
              currentY
            );
  
            currentY+=10;
  
            doc.setFontSize(11);
  
            doc.text(
              `Proveedor: ${supplier?.name ?? 'Desconocido'}`,
              25,
              currentY
            );
  
            currentY+=7;
  
            doc.text(
              `Origen: ${lot.origin}`,
              25,
              currentY
            );
  
            currentY+=7;
  
            doc.text(
              `Método Procesamiento: ${lot.processing_method}`,
              25,
              currentY
            );
  
            currentY+=7;
  
            doc.text(
              `Tipo Café: ${lot.coffee_type}`,
              25,
              currentY
            );
  
            currentY+=7;
  
            doc.text(
              `Peso actual: ${lot.weight} kg`,
              25,
              currentY
            );
  
            currentY+=10;
  
            doc.text(
              'Roast Profiles relacionados:',
              25,
              currentY
            );
  
            currentY+=8;
  
            if(
              relatedRoasts.length===0
            ){
  
              doc.text(
                'Sin perfiles asociados',
                35,
                currentY
              );
  
              currentY+=10;
  
            }else{
  
              autoTable(doc,{
  
                startY:currentY,
  
                head:[[
                  'Profile',
                  'Type',
                  'Duration',
                  'Start Temp',
                  'End Temp',
                  'Final Product'
                ]],
  
                body:
  
                  relatedRoasts.map(r=>([
  
                    r.name,
  
                    r.type,
  
                    r.duration,
  
                    r.tempStart,
  
                    r.tempEnd,
  
                    `${r.type} Roast Product`
  
                  ]))
  
              });
  
              currentY=
                (doc as any)
                .lastAutoTable
                .finalY
                +15;
  
            }
  
            currentY+=20;
  
            if(currentY>250){
  
              doc.addPage();
  
              currentY=20;
  
            }
  
          });
  
          doc.save(
            'reporte-trazabilidad-cafe.pdf'
          );
  
        });
  
      });
  
    });
  
  }
}