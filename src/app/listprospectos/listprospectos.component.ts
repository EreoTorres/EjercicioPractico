import { Component, OnInit } from '@angular/core';
import { ListprospectosService } from '../servicios/http-service/listprospectos/listprospectos.service';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-listprospectos',
  templateUrl: './listprospectos.component.html',
  styleUrls: ['./listprospectos.component.css']
})
export class ListprospectosComponent implements OnInit {
  prospectos: any;
  mensaje: any;
  estatusG: any;
  pagination: any;

  constructor(public listProspectosService: ListprospectosService,public router: Router) { }

  ngOnInit(): void {
    this.getProspectos()
    this.getEstatus()
  }

  getProspectos(filtro=''){
    this.listProspectosService.getProspectos(filtro).then(data => {
      var res: any = data
      res = JSON.parse(res._body)

      if(res.codigo == 200){
        this.prospectos = res.resultado
        this.mensaje = ''
      }else{
        this.mensaje = res.mensaje
      }
    });
  }

  getEstatus(){
    this.listProspectosService.getEstatus().then(data => {
      var res: any = data
      res = JSON.parse(res._body)

      if(res.codigo == 200){
        this.estatusG = res.resultado
      }
    });
  }

  editProspecto(prospecto){
    this.router.navigate(['/detalleprospecto'],
      { queryParams: {detalles: JSON.stringify(prospecto)}, skipLocationChange: true })
  }
}
