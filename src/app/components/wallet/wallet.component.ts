import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialImports } from '../../shared/imports/material-imports';

@Component({
    selector: 'app-wallet',
    standalone: true,
    imports: [
        ...MaterialImports,
        CommonModule,
        ReactiveFormsModule
    ],
    templateUrl: './wallet.component.html',
    styleUrls: ['./wallet.component.scss'],
})

export class WalletComponent implements OnInit {

    ngOnInit(): void {
    }

}