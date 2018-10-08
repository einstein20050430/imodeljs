/*---------------------------------------------------------------------------------------------
* Copyright (c) 2018 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

/** @module Numerics */
import { Geometry, BeJSONFunctions } from "../Geometry";
import { XYAndZ } from "../geometry3d/XYZProps";
import { Point3d, Vector3d, XYZ } from "../geometry3d/Point3dVector3d";
import { Transform } from "../geometry3d/Transform";
import { Matrix3d } from "../geometry3d/Matrix3d";
import { Point4d, Point4dProps } from "./Point4d";
export type Matrix4dProps = Point4dProps[];

/**
 * * A Matrix4d is a matrix with 4 rows and 4 columns.
 * * The 4 rows may be described as the x,y,z,w rows.
 * * The 4 columns may be described as the x,y,z,w columns.
 * * The matrix is physically stored as a FLoat64Array with 16 numbers.
 * * The layout in the Float64Array is "by row"
 * * * indices 0,1,2,3 are the "x row".   They may be called the xx,xy,xz,xw entries
 * * * indices 4,5,6,7 are the "y row"    They may be called the yx,yy,yz,yw entries
 * * * indices 8,9,10,11 are the "z row"  They may be called the zx,zy,zz,zw entries
 * * * indices 12,13,14,15 are the "w row".  They may be called the wx,wy,wz,ww entries
 * * If "w row" contains numeric values 0,0,0,1, the Matrix4d is equivalent to a Transform with
 * * * The upper right 3x3 matrix (entries 0,1,2,4,5,6,8,9,10) are the 3x3 matrix part of the transform
 * * * The far right column entries xw,yw,zw are the "origin" (sometimes called "translation") part of the transform.
 */
export class Matrix4d implements BeJSONFunctions {
  private _coffs: Float64Array;
  private constructor() { this._coffs = new Float64Array(16); }
  public setFrom(other: Matrix4d): void {
    for (let i = 0; i < 16; i++)
      this._coffs[i] = other._coffs[i];
  }
  public clone(): Matrix4d {
    const result = new Matrix4d();
    for (let i = 0; i < 16; i++)
      result._coffs[i] = this._coffs[i];
    return result;
  }
  /** zero this matrix4d in place. */
  public setZero(): void {
    for (let i = 0; i < 16; i++)
      this._coffs[i] = 0;
  }
  /** set to identity. */
  public setIdentity(): void {
    for (let i = 0; i < 16; i++)
      this._coffs[i] = 0;
    this._coffs[0] = this._coffs[5] = this._coffs[10] = this._coffs[15] = 1.0;
  }
  private static is1000(a: number, b: number, c: number, d: number, tol: number): boolean {
    return Math.abs(a - 1.0) <= tol
      && Math.abs(b) <= tol
      && Math.abs(c) <= tol
      && Math.abs(d) <= tol;
  }
  /** set to identity. */
  public isIdentity(tol: number = 1.0e-10): boolean {
    return Matrix4d.is1000(this._coffs[0], this._coffs[1], this._coffs[2], this._coffs[3], tol)
      && Matrix4d.is1000(this._coffs[5], this._coffs[6], this._coffs[7], this._coffs[4], tol)
      && Matrix4d.is1000(this._coffs[10], this._coffs[11], this._coffs[8], this._coffs[9], tol)
      && Matrix4d.is1000(this._coffs[15], this._coffs[12], this._coffs[13], this._coffs[14], tol);
  }
  /** create a Matrix4d filled with zeros. */
  public static createZero(result?: Matrix4d): Matrix4d {
    if (result) {
      result.setZero();
      return result;
    }
    return new Matrix4d(); // this is zero.
  }
  /** create a Matrix4d with values supplied "across the rows" */
  public static createRowValues(cxx: number, cxy: number, cxz: number, cxw: number, cyx: number, cyy: number, cyz: number, cyw: number, czx: number, czy: number, czz: number, czw: number, cwx: number, cwy: number, cwz: number, cww: number, result?: Matrix4d): Matrix4d {
    result = result ? result : new Matrix4d();
    result._coffs[0] = cxx;
    result._coffs[1] = cxy;
    result._coffs[2] = cxz;
    result._coffs[3] = cxw;
    result._coffs[4] = cyx;
    result._coffs[5] = cyy;
    result._coffs[6] = cyz;
    result._coffs[7] = cyw;
    result._coffs[8] = czx;
    result._coffs[9] = czy;
    result._coffs[10] = czz;
    result._coffs[11] = czw;
    result._coffs[12] = cwx;
    result._coffs[13] = cwy;
    result._coffs[14] = cwz;
    result._coffs[15] = cww;
    return result;
  }
  /** directly set columns from typical 3d data:
   *
   * * vectorX, vectorY, vectorZ as columns 0,1,2, with weight0.
   * * origin as column3, with weight 1
   */
  public setOriginAndVectors(origin: XYZ, vectorX: Vector3d, vectorY: Vector3d, vectorZ: Vector3d) {
    this._coffs[0] = vectorX.x;
    this._coffs[1] = vectorY.x;
    this._coffs[2] = vectorZ.x;
    this._coffs[3] = origin.x;
    this._coffs[4] = vectorX.y;
    this._coffs[5] = vectorY.y;
    this._coffs[6] = vectorZ.y;
    this._coffs[7] = origin.y;
    this._coffs[8] = vectorX.z;
    this._coffs[9] = vectorY.z;
    this._coffs[10] = vectorZ.z;
    this._coffs[11] = origin.z;
    this._coffs[12] = 0.0;
    this._coffs[13] = 0.0;
    this._coffs[14] = 0.0;
    this._coffs[15] = 1.0;
  }
  /** promote a transform to full Matrix4d (with 0001 in final row) */
  public static createTransform(source: Transform, result?: Matrix4d): Matrix4d {
    const matrix = source.matrix;
    const point = source.origin;
    return Matrix4d.createRowValues(matrix.coffs[0], matrix.coffs[1], matrix.coffs[2], point.x, matrix.coffs[3], matrix.coffs[4], matrix.coffs[5], point.y, matrix.coffs[6], matrix.coffs[7], matrix.coffs[8], point.z, 0, 0, 0, 1, result);
  }
  /** return an identity matrix. */
  public static createIdentity(result?: Matrix4d): Matrix4d {
    result = Matrix4d.createZero(result);
    result._coffs[0] = 1.0;
    result._coffs[5] = 1.0;
    result._coffs[10] = 1.0;
    result._coffs[15] = 1.0;
    return result;
  }
  /** return matrix with translation directly inserted (along with 1 on diagonal) */
  public static createTranslationXYZ(x: number, y: number, z: number, result?: Matrix4d): Matrix4d {
    result = Matrix4d.createZero(result);
    result._coffs[0] = 1.0;
    result._coffs[5] = 1.0;
    result._coffs[10] = 1.0;
    result._coffs[15] = 1.0;
    result._coffs[3] = x;
    result._coffs[7] = y;
    result._coffs[11] = z;
    return result;
  }
  /**
   * Create a Matrix4d with translation and scaling values directly inserted (along with 1 as final diagonal entry)
   * @param tx x entry for translation column
   * @param ty y entry for translation column
   * @param tz z entry for translation column
   * @param scaleX x diagonal entry
   * @param scaleY y diagonal entry
   * @param scaleZ z diagonal entry
   * @param result optional result.
   */
  public static createTranslationAndScaleXYZ(tx: number, ty: number, tz: number, scaleX: number, scaleY: number, scaleZ: number, result?: Matrix4d): Matrix4d {
    return Matrix4d.createRowValues(scaleX, 0, 0, tx, 0, scaleY, 0, ty, 0, 0, scaleZ, tz, 0, 0, 0, 1, result);
  }
  /**
   * Create a mapping the scales and translates (no rotation) from box A to boxB
   * @param lowA low point of box A
   * @param highA high point of box A
   * @param lowB low point of box B
   * @param highB high point of box B
   */
  public static createBoxToBox(lowA: Point3d, highA: Point3d, lowB: Point3d, highB: Point3d, result?: Matrix4d): Matrix4d | undefined {
    const ax = highA.x - lowA.x;
    const ay = highA.y - lowA.y;
    const az = highA.z - lowA.z;
    const bx = highB.x - lowB.x;
    const by = highB.y - lowB.y;
    const bz = highB.z - lowB.z;
    const abx = Geometry.conditionalDivideFraction(bx, ax);
    const aby = Geometry.conditionalDivideFraction(by, ay);
    const abz = Geometry.conditionalDivideFraction(bz, az);
    if (abx !== undefined && aby !== undefined && abz !== undefined) {
      return Matrix4d.createTranslationAndScaleXYZ(lowB.x - abx * lowA.x, lowB.y - aby * lowA.y, lowB.z - abz * lowA.z, abx, aby, abz, result);
    }
    return undefined;
  }
  public setFromJSON(json?: Matrix4dProps) {
    if (Geometry.isArrayOfNumberArray(json, 4, 4))
      for (let i = 0; i < 4; ++i) {
        for (let j = 0; j < 4; ++j)
          this._coffs[i * 4 + j] = json![i][j];
      }
    else
      this.setZero();
  }
  /**
   * Return the largest (absolute) difference between this and other Matrix4d.
   * @param other matrix to compare to
   */
  public maxDiff(other: Matrix4d): number {
    let a = 0.0;
    for (let i = 0; i < 16; i++)
      a = Math.max(a, Math.abs(this._coffs[i] - other._coffs[i]));
    return a;
  }
  /**
   * Return the largest absolute value in the Matrix4d
   */
  public maxAbs(): number {
    let a = 0.0;
    for (let i = 0; i < 16; i++)
      a = Math.max(a, Math.abs(this._coffs[i]));
    return a;
  }
  public isAlmostEqual(other: Matrix4d): boolean {
    return Geometry.isSmallMetricDistance(this.maxDiff(other));
  }
  /**
   * Convert an Matrix4d to a Matrix4dProps.
   */
  public toJSON(): Matrix4dProps {
    const value = [];
    for (let i = 0; i < 4; ++i) {
      const row = i * 4;
      value.push([this._coffs[row], this._coffs[row + 1], this._coffs[row + 2], this._coffs[row + 3]]);
    }
    return value;
  }
  public static fromJSON(json?: Matrix4dProps) {
    const result = new Matrix4d();
    result.setFromJSON(json);
    return result;
  }
  /**
   * Return a point with entries from positions [i0, i0+step, i0+2*step, i0+3*step].
   * * There are no tests for index going out of the 0..15 range.
   * * Usual uses are:
   * * * i0 at left of row (0,4,8,12), step = 1 to extract a row.
   * * * i0 at top of row (0,1,2,3), step = 4 to extract a column
   * * * i0 = 0, step = 5 to extract the diagonal
   * @returns a Point4d with 4 entries taken from positions at steps in the flat 16-member array.
   * @param i0 start index (for 16 member array)
   * @param step step between members
   * @param result optional preallocated point.
   */
  public getSteppedPoint(i0: number, step: number, result?: Point4d): Point4d {
    return Point4d.create(this._coffs[i0], this._coffs[i0 + step], this._coffs[i0 + 2 * step], this._coffs[i0 + 3 * step], result);
  }
  /** @returns Return column 0 as Point4d. */
  public columnX(): Point4d { return this.getSteppedPoint(0, 4); }
  /** @returns Return column 1 as Point4d. */
  public columnY(): Point4d { return this.getSteppedPoint(1, 4); }
  /** @returns Return column 2 as Point4d. */
  public columnZ(): Point4d { return this.getSteppedPoint(2, 4); }
  /** @returns Return column 3 as Point4d. */
  public columnW(): Point4d { return this.getSteppedPoint(3, 4); }
  /** @returns Return row 0 as Point4d. */
  public rowX(): Point4d { return this.getSteppedPoint(0, 1); }
  /** @returns Return row 1 as Point4d. */
  public rowY(): Point4d { return this.getSteppedPoint(4, 1); }
  /** @returns Return row 2 as Point4d. */
  public rowZ(): Point4d { return this.getSteppedPoint(8, 1); }
  /** @returns Return row 3 as Point4d. */
  public rowW(): Point4d { return this.getSteppedPoint(12, 1); }
  /**
   * @returns true if the 2 row has content other than [0,0,0,1]
   */
  public get hasPerspective(): boolean {
    return this._coffs[12] !== 0.0
      || this._coffs[13] !== 0.0
      || this._coffs[14] !== 0.0
      || this._coffs[15] !== 1.0;
  }
  /**
   * Return a Point4d with the diagonal entries of the matrix
   */
  public diagonal(): Point4d { return this.getSteppedPoint(0, 5); }
  /** return the weight component of this matrix */
  public weight(): number { return this._coffs[15]; }
  /** return the leading 3x3 matrix part of this matrix */
  public matrixPart(): Matrix3d {
    return Matrix3d.createRowValues(this._coffs[0], this._coffs[1], this._coffs[2], this._coffs[4], this._coffs[5], this._coffs[6], this._coffs[8], this._coffs[9], this._coffs[10]);
  }
  /**
   * Return the (affine, non-perspective) Transform with the upper 3 rows of this matrix
   * @return undefined if this Matrix4d has perspective effects in the w row.
   */
  public get asTransform(): Transform | undefined {
    if (this.hasPerspective)
      return undefined;
    return Transform.createRowValues(this._coffs[0], this._coffs[1], this._coffs[2], this._coffs[3], this._coffs[4], this._coffs[5], this._coffs[6], this._coffs[7], this._coffs[8], this._coffs[9], this._coffs[10], this._coffs[11]);
  }
  /** multiply this * other. */
  public multiplyMatrixMatrix(other: Matrix4d, result?: Matrix4d): Matrix4d {
    result = (result && result !== this && result !== other) ? result : new Matrix4d();
    for (let i0 = 0; i0 < 16; i0 += 4) {
      for (let k = 0; k < 4; k++)
        result._coffs[i0 + k] =
          this._coffs[i0] * other._coffs[k] +
          this._coffs[i0 + 1] * other._coffs[k + 4] +
          this._coffs[i0 + 2] * other._coffs[k + 8] +
          this._coffs[i0 + 3] * other._coffs[k + 12];
    }
    return result;
  }
  /** multiply this * transpose(other). */
  public multiplyMatrixMatrixTranspose(other: Matrix4d, result?: Matrix4d): Matrix4d {
    result = (result && result !== this && result !== other) ? result : new Matrix4d();
    let j = 0;
    for (let i0 = 0; i0 < 16; i0 += 4) {
      for (let k = 0; k < 16; k += 4)
        result._coffs[j++] =
          this._coffs[i0] * other._coffs[k] +
          this._coffs[i0 + 1] * other._coffs[k + 1] +
          this._coffs[i0 + 2] * other._coffs[k + 2] +
          this._coffs[i0 + 3] * other._coffs[k + 3];
    }
    return result;
  }
  /** multiply transpose (this) * other. */
  public multiplyMatrixTransposeMatrix(other: Matrix4d, result?: Matrix4d): Matrix4d {
    result = (result && result !== this && result !== other) ? result : new Matrix4d();
    let j = 0;
    for (let i0 = 0; i0 < 4; i0 += 1) {
      for (let k0 = 0; k0 < 4; k0 += 1)
        result._coffs[j++] =
          this._coffs[i0] * other._coffs[k0] +
          this._coffs[i0 + 4] * other._coffs[k0 + 4] +
          this._coffs[i0 + 8] * other._coffs[k0 + 8] +
          this._coffs[i0 + 12] * other._coffs[k0 + 12];
    }
    return result;
  }
  /** Return a transposed matrix. */
  public cloneTransposed(result?: Matrix4d): Matrix4d {
    return Matrix4d.createRowValues(this._coffs[0], this._coffs[4], this._coffs[8], this._coffs[12], this._coffs[1], this._coffs[5], this._coffs[9], this._coffs[13], this._coffs[2], this._coffs[6], this._coffs[10], this._coffs[14], this._coffs[3], this._coffs[7], this._coffs[11], this._coffs[15], result);
  }
  /** multiply matrix times column [x,y,z,w].  return as Point4d.   (And the returned value is NOT normalized down to unit w) */
  public multiplyXYZW(x: number, y: number, z: number, w: number, result?: Point4d): Point4d {
    result = result ? result : Point4d.createZero();
    return result.set(this._coffs[0] * x + this._coffs[1] * y + this._coffs[2] * z + this._coffs[3] * w, this._coffs[4] * x + this._coffs[5] * y + this._coffs[6] * z + this._coffs[7] * w, this._coffs[8] * x + this._coffs[9] * y + this._coffs[10] * z + this._coffs[11] * w, this._coffs[12] * x + this._coffs[13] * y + this._coffs[14] * z + this._coffs[15] * w);
  }
  /** multiply matrix times column vectors [x,y,z,w] where [x,y,z,w] appear in blocks in an array.
   * replace the xyzw in the block
   */
  public multiplyBlockedFloat64ArrayInPlace(data: Float64Array) {
    const n = data.length;
    let x, y, z, w;
    for (let i = 0; i + 3 < n; i += 4) {
      x = data[i];
      y = data[i + 1];
      z = data[i + 2];
      w = data[i + 3];
      data[i] = this._coffs[0] * x + this._coffs[1] * y + this._coffs[2] * z + this._coffs[3] * w;
      data[i + 1] = this._coffs[4] * x + this._coffs[5] * y + this._coffs[6] * z + this._coffs[7] * w;
      data[i + 2] = this._coffs[8] * x + this._coffs[9] * y + this._coffs[10] * z + this._coffs[11] * w;
      data[i + 3] = this._coffs[12] * x + this._coffs[13] * y + this._coffs[14] * z + this._coffs[15] * w;
    }
  }
  /** multiply matrix times XYAndZ  and w. return as Point4d  (And the returned value is NOT normalized down to unit w) */
  public multiplyPoint3d(pt: XYAndZ, w: number, result?: Point4d): Point4d {
    return this.multiplyXYZW(pt.x, pt.y, pt.z, w, result);
  }
  /** multiply matrix times and array  of XYAndZ. return as array of Point4d  (And the returned value is NOT normalized down to unit w) */
  public multiplyPoint3dArray(pts: XYAndZ[], results: Point4d[], w: number = 1.0): void {
    pts.forEach((pt, i) => { results[i] = this.multiplyXYZW(pt.x, pt.y, pt.z, w, results[i]); });
  }
  /** multiply [x,y,z,w] times matrix.  return as Point4d.   (And the returned value is NOT normalized down to unit w) */
  public multiplyTransposeXYZW(x: number, y: number, z: number, w: number, result?: Point4d): Point4d {
    result = result ? result : Point4d.createZero();
    return result.set(this._coffs[0] * x + this._coffs[4] * y + this._coffs[8] * z + this._coffs[12] * w, this._coffs[1] * x + this._coffs[5] * y + this._coffs[9] * z + this._coffs[13] * w, this._coffs[2] * x + this._coffs[6] * y + this._coffs[10] * z + this._coffs[14] * w, this._coffs[3] * x + this._coffs[7] * y + this._coffs[11] * z + this._coffs[15] * w);
  }
  /** @returns dot product of row rowIndex of this with column columnIndex of other.
   */
  public rowDotColumn(rowIndex: number, other: Matrix4d, columnIndex: number): number {
    const i = rowIndex * 4;
    const j = columnIndex;
    return this._coffs[i] * other._coffs[j]
      + this._coffs[i + 1] * other._coffs[j + 4]
      + this._coffs[i + 2] * other._coffs[j + 8]
      + this._coffs[i + 3] * other._coffs[j + 12];
  }
  /** @returns dot product of row rowIndexThis of this with row rowIndexOther of other.
   */
  public rowDotRow(rowIndexThis: number, other: Matrix4d, rowIndexOther: number): number {
    const i = rowIndexThis * 4;
    const j = rowIndexOther * 4;
    return this._coffs[i] * other._coffs[j]
      + this._coffs[i + 1] * other._coffs[j + 1]
      + this._coffs[i + 2] * other._coffs[j + 2]
      + this._coffs[i + 3] * other._coffs[j + 3];
  }
  /** @returns dot product of row rowIndexThis of this with row rowIndexOther of other.
   */
  public columnDotColumn(columnIndexThis: number, other: Matrix4d, columnIndexOther: number): number {
    const i = columnIndexThis;
    const j = columnIndexOther;
    return this._coffs[i] * other._coffs[j]
      + this._coffs[i + 4] * other._coffs[j + 4]
      + this._coffs[i + 8] * other._coffs[j + 8]
      + this._coffs[i + 12] * other._coffs[j + 12];
  }
  /** @returns dot product of column columnIndexThis of this with row rowIndexOther other.
   */
  public columnDotRow(columnIndexThis: number, other: Matrix4d, rowIndexOther: number): number {
    const i = columnIndexThis;
    const j = 4 * rowIndexOther;
    return this._coffs[i] * other._coffs[j]
      + this._coffs[i + 4] * other._coffs[j + 1]
      + this._coffs[i + 8] * other._coffs[j + 2]
      + this._coffs[i + 12] * other._coffs[j + 3];
  }
  /** @returns return a matrix entry by row and column index.
   */
  public atIJ(rowIndex: number, columnIndex: number): number {
    return this._coffs[rowIndex * 4 + columnIndex];
  }
  /** multiply matrix * [x,y,z,w]. immediately renormalize to return in a Point3d.
   * If zero weight appears in the result (i.e. input is on eyeplane) leave the mapped xyz untouched.
   */
  public multiplyXYZWQuietRenormalize(x: number, y: number, z: number, w: number, result?: Point3d): Point3d {
    result = result ? result : Point3d.createZero();
    result.set(this._coffs[0] * x + this._coffs[1] * y + this._coffs[2] * z + this._coffs[3] * w, this._coffs[4] * x + this._coffs[5] * y + this._coffs[6] * z + this._coffs[7] * w, this._coffs[8] * x + this._coffs[9] * y + this._coffs[10] * z + this._coffs[11] * w);
    const w1 = this._coffs[12] * x + this._coffs[13] * y + this._coffs[14] * z + this._coffs[15] * w;
    if (!Geometry.isSmallMetricDistance(w1)) {
      const a = 1.0 / w1;
      result.x *= a;
      result.y *= a;
      result.z *= a;
    }
    return result;
  }
  /** multiply matrix * an array of Point4d. immediately renormalize to return in an array of Point3d. */
  public multiplyPoint4dArrayQuietRenormalize(pts: Point4d[], results: Point3d[]): void {
    pts.forEach((pt, i) => { results[i] = this.multiplyXYZWQuietRenormalize(pt.x, pt.y, pt.z, pt.w, results[i]); });
  }
  /** multiply a Point4d, return with the optional result convention. */
  public multiplyPoint4d(point: Point4d, result?: Point4d): Point4d {
    return this.multiplyXYZW(point.xyzw[0], point.xyzw[1], point.xyzw[2], point.xyzw[3], result);
  }
  /** multiply a Point4d, return with the optional result convention. */
  public multiplyTransposePoint4d(point: Point4d, result?: Point4d): Point4d {
    return this.multiplyTransposeXYZW(point.xyzw[0], point.xyzw[1], point.xyzw[2], point.xyzw[3], result);
  }
  /** multiply matrix * point. This produces a weighted xyzw.
   * Immediately renormalize back to xyz and return (with optional result convention).
   * If zero weight appears in the result (i.e. input is on eyeplane)leave the mapped xyz untouched.
   */
  public multiplyPoint3dQuietNormalize(point: XYAndZ, result?: Point3d): Point3d {
    return this.multiplyXYZWQuietRenormalize(point.x, point.y, point.z, 1.0, result);
  }
  /** multiply each matrix * points[i].   This produces a weighted xyzw.
   * Immediately renormalize back to xyz and replace the original point.
   * If zero weight appears in the result (i.e. input is on eyeplane)leave the mapped xyz untouched.
   */
  public multiplyPoint3dArrayQuietNormalize(points: Point3d[]) {
    points.forEach((point) => this.multiplyXYZWQuietRenormalize(point.x, point.y, point.z, 1.0, point));
  }
  /**
   * Add the product terms [xx,xy,xz,xw, yx, yy, yz, yw, zx, zy, zz, zs, wx, wy, wz, ww] to respective entries in the matrix
   * @param x x component for products
   * @param y y component for products
   * @param z z component for products
   * @param w w component for products
   */
  public addMomentsInPlace(x: number, y: number, z: number, w: number) {
    this._coffs[0] += x * x;
    this._coffs[1] += x * y;
    this._coffs[2] += x * z;
    this._coffs[3] += x * w;
    this._coffs[4] += y * x;
    this._coffs[5] += y * y;
    this._coffs[6] += y * z;
    this._coffs[7] += y * w;
    this._coffs[8] += z * x;
    this._coffs[9] += z * y;
    this._coffs[10] += z * z;
    this._coffs[11] += z * w;
    this._coffs[12] += w * x;
    this._coffs[13] += w * y;
    this._coffs[14] += w * z;
    this._coffs[15] += w * w;
  }
  /** accumulate all coefficients of other to this. */
  public addScaledInPlace(other: Matrix4d, scale: number = 1.0) {
    for (let i = 0; i < 16; i++)
      this._coffs[i] += scale * other._coffs[i];
  }
  /**
   * Add scale times rowA to rowB.
   * @param rowIndexA row that is not modified
   * @param rowIndexB row that is modified.
   * @param firstColumnIndex first column modified.  All from there to the right are updated
   * @param scale scale
   */
  public rowOperation(rowIndexA: number, rowIndexB: number, firstColumnIndex: number, scale: number) {
    if (scale === 0.0)
      return;
    let iA = rowIndexA * 4 + firstColumnIndex;
    let iB = rowIndexB * 4 + firstColumnIndex;
    for (let i = firstColumnIndex; i < 4; i++ , iA++ , iB++)
      this._coffs[iB] += scale * this._coffs[iA];
  }
  /** Compute an inverse matrix.
   * * This uses simple Bauss-Jordan elimination -- no pivot.
   * @returns undefined if 1/pivot becomes too large. (i.e. apparent 0 pivot)
   */
  public createInverse(): Matrix4d | undefined {
    const work = this.clone();
    const inverse = Matrix4d.createIdentity();
    // console.log(work.rowArrays());
    // console.log(inverse.rowArrays());
    let pivotIndex;
    let pivotRow;
    let pivotValue;
    let divPivot;
    // Downward gaussian elimination, no pivoting:
    for (pivotRow = 0; pivotRow < 3; pivotRow++) {
      pivotIndex = pivotRow * 5;
      pivotValue = work._coffs[pivotIndex];
      // console.log("** pivot row " + pivotRow + " pivotvalue " + pivotValue);
      divPivot = Geometry.conditionalDivideFraction(1.0, pivotValue);
      if (divPivot === undefined)
        return undefined;
      let indexB = pivotIndex + 4;
      for (let rowB = pivotRow + 1; rowB < 4; rowB++ , indexB += 4) {
        const scale = -work._coffs[indexB] * divPivot;
        work.rowOperation(pivotRow, rowB, pivotRow, scale);
        inverse.rowOperation(pivotRow, rowB, 0, scale);
        // console.log(work.rowArrays());
        // console.log(inverse.rowArrays());
      }
    }
    // console.log("\n**********************Backsub\n");
    // upward gaussian elimination ...
    for (pivotRow = 1; pivotRow < 4; pivotRow++) {
      pivotIndex = pivotRow * 5;
      pivotValue = work._coffs[pivotIndex];
      // console.log("** pivot row " + pivotRow + " pivotvalue " + pivotValue);
      divPivot = Geometry.conditionalDivideFraction(1.0, pivotValue);
      if (divPivot === undefined)
        return undefined;
      let indexB = pivotRow;
      for (let rowB = 0; rowB < pivotRow; rowB++ , indexB += 4) {
        const scale = -work._coffs[indexB] * divPivot;
        work.rowOperation(pivotRow, rowB, pivotRow, scale);
        inverse.rowOperation(pivotRow, rowB, 0, scale);
        // console.log("Eliminate Row " + rowB + " from pivot " + pivotRow);
        // console.log(work.rowArrays());
        // console.log(inverse.rowArrays());
      }
    }
    // divide through by pivots (all have  beeen confirmed nonzero)
    inverse.scaleRowsInPlace(1.0 / work._coffs[0], 1.0 / work._coffs[5], 1.0 / work._coffs[10], 1.0 / work._coffs[15]);
    // console.log("descaled", inverse.rowArrays());
    return inverse;
  }
  /** @returns Restructure the matrix rows as separate arrays. (Useful for printing)
   * @param f optional function to provide alternate values for each entry (e.g. force fuzz to zero.)
   */
  public rowArrays(f?: (value: number) => any): any {
    if (f)
      return [
        [f(this._coffs[0]), f(this._coffs[1]), f(this._coffs[2]), f(this._coffs[3])],
        [f(this._coffs[4]), f(this._coffs[5]), f(this._coffs[6]), f(this._coffs[7])],
        [f(this._coffs[8]), f(this._coffs[9]), f(this._coffs[10]), f(this._coffs[11])],
        [f(this._coffs[12]), f(this._coffs[13]), f(this._coffs[14]), f(this._coffs[15])]];
    else
      return [
        [this._coffs[0], this._coffs[1], this._coffs[2], this._coffs[3]],
        [this._coffs[4], this._coffs[5], this._coffs[6], this._coffs[7]],
        [this._coffs[8], this._coffs[9], this._coffs[10], this._coffs[11]],
        [this._coffs[12], this._coffs[13], this._coffs[14], this._coffs[15]]];
  }
  /**
   * Scale each row by respective scale factors.
   * @param ax scale factor for row 0
   * @param ay scale factor for row 1
   * @param az scale factor for row 2
   * @param aw scale factor for row 3
   */
  public scaleRowsInPlace(ax: number, ay: number, az: number, aw: number) {
    for (let i = 0; i < 4; i++)
      this._coffs[i] *= ax;
    for (let i = 4; i < 8; i++)
      this._coffs[i] *= ay;
    for (let i = 8; i < 12; i++)
      this._coffs[i] *= az;
    for (let i = 12; i < 16; i++)
      this._coffs[i] *= aw;
  }
}
